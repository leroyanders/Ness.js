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
  // Optional: only used to bound index growth, never for correctness.
  const pExpire =
    typeof client.pExpire === 'function'
      ? client.pExpire.bind(client)
      : typeof client.pexpire === 'function'
        ? client.pexpire.bind(client)
        : async () => 0;

  return {
    get,
    del,
    sAdd,
    sRem,
    sMembers,
    pExpire,
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
  constructor(
    client,
    { prefix = 'ness:cache:', scanCount = 256, indexGrace = 60_000 } = {},
  ) {
    if (!client) throw new TypeError('RedisCacheAdapter requires a client.');
    this.client = createClientShim(client);
    this.prefix = prefix;
    this.scanCount = scanCount;
    /** How long an index set outlives its longest-lived member, in ms. */
    this.indexGrace = indexGrace;
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
    const ttl = expiryMs(entry);
    await this.client.set(this.#entryKey(key), encodeEntry(key, entry), ttl);

    const indexes = [
      ...(entry.tags || []).map(tag => this.#tagKey(tag)),
      ...(entry.path ? [this.#pathKey(entry.path), this.#pathRegistry] : []),
    ];
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

    // An index set outlives the entries it points at: Redis drops an entry on
    // its own TTL and nothing then removes the membership. Correctness is
    // already handled — NessCache treats the index as candidates and re-reads
    // each entry — but without an expiry these sets grow without bound on a
    // rotating key space. Each write pushes the expiry out, so a set always
    // outlives its longest-lived member.
    if (ttl) {
      await Promise.all(
        indexes.map(name =>
          this.client.pExpire(name, ttl + this.indexGrace).catch(() => {}),
        ),
      );
    }
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
