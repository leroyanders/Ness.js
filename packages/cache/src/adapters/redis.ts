import type { CacheAdapter, CacheEntry } from '../index.js';
import {
  decodeEntry,
  encodeEntry,
  expiryMs,
  matchesPath,
} from './serialize.js';

/**
 * Structurally compatible with node-redis v4+ and ioredis. Commands are looked
 * up by name at runtime, so the type stays deliberately open: an index
 * signature would reject a class instance, which is what both clients are.
 */
export type RedisLikeClient = object;

export interface RedisCacheAdapterOptions {
  /** Key namespace. Defaults to `ness:cache:`. */
  prefix?: string;
  /** SCAN batch size. Defaults to 256. */
  scanCount?: number;
  /** How long an index set outlives its longest-lived member, in ms. */
  indexGrace?: number;
}

type RedisCommand = (...args: unknown[]) => Promise<unknown>;

interface ScanPage {
  cursor: number;
  keys: string[];
}

/** The uniform surface the adapter talks to, whichever client was injected. */
export interface RedisClientShim {
  get(key: string): Promise<string | null>;
  del(key: string): Promise<unknown>;
  sAdd(key: string, member: string): Promise<unknown>;
  sRem(key: string, member: string): Promise<unknown>;
  sMembers(key: string): Promise<string[]>;
  pExpire(key: string, ttl: number): Promise<unknown>;
  set(key: string, value: string, ttl?: number | undefined): Promise<unknown>;
  scan(cursor: number, match: string, count: number): Promise<ScanPage>;
}

function pick(client: RedisLikeClient, ...names: string[]): RedisCommand {
  const commands = client as Record<string, unknown>;
  const name = names.find(
    candidate => typeof commands[candidate] === 'function',
  );
  if (!name) {
    throw new TypeError(
      `The Redis client is missing ${names[0]}(). Pass a node-redis or ioredis compatible client.`,
    );
  }
  return (commands[name] as RedisCommand).bind(client);
}

/**
 * node-redis uses camelCase and options objects; ioredis uses lowercase and
 * variadic arguments. Normalizing here means neither becomes a dependency of
 * this package.
 */
function createClientShim(client: RedisLikeClient): RedisClientShim {
  const commands = client as Record<string, unknown>;
  const isNodeRedis = typeof commands['sAdd'] === 'function';
  const get = pick(client, 'get');
  const set = pick(client, 'set');
  const del = pick(client, 'del', 'unlink');
  const sAdd = pick(client, 'sAdd', 'sadd');
  const sRem = pick(client, 'sRem', 'srem');
  const sMembers = pick(client, 'sMembers', 'smembers');
  const scan = pick(client, 'scan');
  // Optional: only used to bound index growth, never for correctness.
  const pExpire: RedisCommand =
    typeof commands['pExpire'] === 'function'
      ? (commands['pExpire'] as RedisCommand).bind(client)
      : typeof commands['pexpire'] === 'function'
        ? (commands['pexpire'] as RedisCommand).bind(client)
        : async () => 0;

  return {
    get: key => get(key) as Promise<string | null>,
    del: key => del(key),
    sAdd: (key, member) => sAdd(key, member),
    sRem: (key, member) => sRem(key, member),
    sMembers: key => sMembers(key) as Promise<string[]>,
    pExpire: (key, ttl) => pExpire(key, ttl),
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
        ? { cursor: Number(result[0]), keys: result[1] as string[] }
        : {
            cursor: Number((result as ScanPage).cursor),
            keys: (result as ScanPage).keys,
          };
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
class RedisCacheAdapter implements CacheAdapter {
  client: RedisClientShim;
  prefix: string;
  scanCount: number;
  /** How long an index set outlives its longest-lived member, in ms. */
  indexGrace: number;

  constructor(
    client: RedisLikeClient,
    {
      prefix = 'ness:cache:',
      scanCount = 256,
      indexGrace = 60_000,
    }: RedisCacheAdapterOptions = {},
  ) {
    if (!client) throw new TypeError('RedisCacheAdapter requires a client.');
    this.client = createClientShim(client);
    this.prefix = prefix;
    this.scanCount = scanCount;
    this.indexGrace = indexGrace;
  }

  #entryKey(key: string): string {
    return `${this.prefix}entry:${key}`;
  }

  #tagKey(tag: string): string {
    return `${this.prefix}tag:${tag}`;
  }

  #pathKey(pathname: string): string {
    return `${this.prefix}path:${pathname}`;
  }

  get #pathRegistry(): string {
    return `${this.prefix}paths`;
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    return decodeEntry(await this.client.get(this.#entryKey(key)));
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
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
            await this.client.sAdd(this.#pathKey(entry.path), key),
            await this.client.sAdd(this.#pathRegistry, entry.path),
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

  async delete(key: string): Promise<void> {
    await this.#unindex(key);
    await this.client.del(this.#entryKey(key));
  }

  async keys(): Promise<string[]> {
    const found: string[] = [];
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

  async clear(): Promise<void> {
    const keys = await this.keys();
    await Promise.all(keys.map(key => this.delete(key)));
    const paths = await this.client.sMembers(this.#pathRegistry);
    await Promise.all([
      ...paths.map(pathname => this.client.del(this.#pathKey(pathname))),
      this.client.del(this.#pathRegistry),
    ]);
  }

  async keysByTag(tag: string): Promise<string[]> {
    return this.client.sMembers(this.#tagKey(tag));
  }

  async keysByPath(pathname: string): Promise<string[]> {
    const registered = await this.client.sMembers(this.#pathRegistry);
    const matched = await Promise.all(
      registered
        .filter(candidate => matchesPath(candidate, pathname))
        .map(candidate => this.client.sMembers(this.#pathKey(candidate))),
    );
    return matched.flat();
  }

  async #unindex(key: string): Promise<void> {
    const previous = await this.get(key);
    if (!previous) return;
    await Promise.all([
      ...(previous.tags || []).map(tag =>
        this.client.sRem(this.#tagKey(tag), key),
      ),
      ...(previous.path
        ? [await this.client.sRem(this.#pathKey(previous.path), key)]
        : []),
    ]);
  }
}

export { RedisCacheAdapter, createClientShim };
export default RedisCacheAdapter;
