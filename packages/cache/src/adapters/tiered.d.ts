import type { CacheAdapter, CacheEntry } from '../index.js';

export interface InvalidationMessage {
  type: 'evict' | 'clear';
  key?: string;
}

export interface InvalidationBus {
  publish(message: InvalidationMessage): Promise<void> | void;
  subscribe(
    handler: (message: InvalidationMessage) => void,
  ): (() => Promise<void> | void) | undefined;
}

export interface TieredCacheAdapterOptions {
  /** In-process tier. Defaults to a fresh `MemoryCacheAdapter`. */
  local?: CacheAdapter;
  /** Broadcasts evictions between instances. Strongly recommended. */
  bus?: InvalidationBus;
  /**
   * Seconds a local copy may be trusted without confirmation from the shared
   * store. Bounds staleness when no bus is configured. Defaults to 5.
   */
  localTtl?: number;
  clock?: () => number;
}

export class TieredCacheAdapter implements CacheAdapter {
  constructor(shared: CacheAdapter, options?: TieredCacheAdapterOptions);
  get(key: string): Promise<CacheEntry | undefined>;
  set(key: string, entry: CacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  keysByTag(tag: string): Promise<string[]>;
  keysByPath(pathname: string): Promise<string[]>;
  close(): Promise<void>;
}

export function createRedisInvalidationBus(
  publisher: unknown,
  subscriber: unknown,
  options?: { channel?: string; id?: string },
): InvalidationBus;

export default TieredCacheAdapter;
