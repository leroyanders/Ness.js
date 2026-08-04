import {
  decodeEntry,
  encodeEntry,
  expiryMs,
  matchesPath,
} from './serialize.js';

function pick(client, ...names) {
  const name = names.find(candidate => typeof client[candidate] === 'function');
  if (!name) {
    throw new TypeError(
      `The Redis client is missing ${names[0]}(). Pass a node-redis or ioredis compatible client.`,
    );
  }
  return client[name].bind(client);
}

/**
 * node-redis uses camelCase and options objects; ioredis uses lowercase and
 * variadic arguments. Normalizing here means neither becomes a dependency of
 * this package.
 */
function createClientShim(client) {
  const isNodeRedis = typeof client.sAdd === 'function';
  const get = pick(client, 'get');
  const set = pick(client, 'set');
  const del = pick(client, 'del', 'unlink');
  const sAdd = pick(client, 'sAdd', 'sadd');
  const sRem = pick(client, 'sRem', 'srem');
  const sMembers = pick(client, 'sMembers', 'smembers');
  const scan = pick(client, 'scan');

  return {
    get,
    del,
    sAdd,
    sRem,
    sMembers,
    async set(key, value, ttl) {
      if (!ttl) return set(key, value);
      return isNodeRedis
        ? set(key, value, { PX: ttl })
        : set(key, value, 'PX', ttl);
    },
    async scan(cursor, match, count) {
      const result = isNodeRedis
        ? await scan(cursor, { MATCH: match, COUNT: count })
        : await scan(cursor, 'MATCH', match, 'COUNT', count);
      return Array.isArray(result)
        ? { cursor: Number(result[0]), keys: result[1] }
        : { cursor: Number(result.cursor), keys: result.keys };
    },
  };
}

/**
 * Backs the cache with Redis so every instance behind a load balancer shares
 * one view of it: `revalidateTag` on one pod invalidates the entry everywhere,
 * and stale-while-revalidate stops depending on which pod served the request.
 *
 * The client is injected rather than imported, so applications keep control of
 * connection, TLS, and pooling, and this package stays dependency-free.
 */
class RedisCacheAdapter {
  constructor(client, { prefix = 'ness:cache:', scanCount = 256 } = {}) {
    if (!client) throw new TypeError('RedisCacheAdapter requires a client.');
    this.client = createClientShim(client);
    this.prefix = prefix;
    this.scanCount = scanCount;
  }

  #entryKey(key) {
    return `${this.prefix}entry:${key}`;
  }

  #tagKey(tag) {
    return `${this.prefix}tag:${tag}`;
  }

  #pathKey(pathname) {
    return `${this.prefix}path:${pathname}`;
  }

  get #pathRegistry() {
    return `${this.prefix}paths`;
  }

  async get(key) {
    return decodeEntry(await this.client.get(this.#entryKey(key)));
  }

  async set(key, entry) {
    await this.#unindex(key);
    await this.client.set(
      this.#entryKey(key),
      encodeEntry(key, entry),
      expiryMs(entry),
    );
    await Promise.all([
      ...(entry.tags || []).map(tag =>
        this.client.sAdd(this.#tagKey(tag), key),
      ),
      ...(entry.path
        ? [
            this.client.sAdd(this.#pathKey(entry.path), key),
            this.client.sAdd(this.#pathRegistry, entry.path),
          ]
        : []),
    ]);
  }

  async delete(key) {
    await this.#unindex(key);
    await this.client.del(this.#entryKey(key));
  }

  async keys() {
    const found = [];
    const offset = `${this.prefix}entry:`.length;
    let cursor = 0;
    do {
      const result = await this.client.scan(
        cursor,
        `${this.prefix}entry:*`,
        this.scanCount,
      );
      cursor = result.cursor;
      for (const key of result.keys) found.push(key.slice(offset));
    } while (cursor !== 0);
    return found;
  }

  async clear() {
    const keys = await this.keys();
    await Promise.all(keys.map(key => this.delete(key)));
    const paths = await this.client.sMembers(this.#pathRegistry);
    await Promise.all([
      ...paths.map(pathname => this.client.del(this.#pathKey(pathname))),
      this.client.del(this.#pathRegistry),
    ]);
  }

  async keysByTag(tag) {
    return this.client.sMembers(this.#tagKey(tag));
  }

  async keysByPath(pathname) {
    const registered = await this.client.sMembers(this.#pathRegistry);
    const matched = await Promise.all(
      registered
        .filter(candidate => matchesPath(candidate, pathname))
        .map(candidate => this.client.sMembers(this.#pathKey(candidate))),
    );
    return matched.flat();
  }

  async #unindex(key) {
    const previous = await this.get(key);
    if (!previous) return;
    await Promise.all([
      ...(previous.tags || []).map(tag =>
        this.client.sRem(this.#tagKey(tag), key),
      ),
      ...(previous.path
        ? [this.client.sRem(this.#pathKey(previous.path), key)]
        : []),
    ]);
  }
}

export { RedisCacheAdapter, createClientShim };
export default RedisCacheAdapter;
