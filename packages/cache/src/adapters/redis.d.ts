import type { CacheAdapter, CacheEntry } from '../index.js';

/**
 * Structurally compatible with node-redis v4+ and ioredis. Only the commands
 * the adapter uses are required.
 */
export interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  set(...args: never[]): Promise<unknown>;
  del(key: string): Promise<unknown>;
  scan(...args: never[]): Promise<unknown>;
  [command: string]: unknown;
}

export interface RedisCacheAdapterOptions {
  /** Key namespace. Defaults to `ness:cache:`. */
  prefix?: string;
  /** SCAN batch size. Defaults to 256. */
  scanCount?: number;
}

export class RedisCacheAdapter implements CacheAdapter {
  constructor(client: RedisLikeClient, options?: RedisCacheAdapterOptions);
  get(key: string): Promise<CacheEntry | undefined>;
  set(key: string, entry: CacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  keysByTag(tag: string): Promise<string[]>;
  keysByPath(pathname: string): Promise<string[]>;
}

export default RedisCacheAdapter;
