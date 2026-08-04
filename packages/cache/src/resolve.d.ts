import type { CacheAdapter, NessCache } from './index.js';
import type { InvalidationBus } from './adapters/tiered.js';

export type CacheAdapterKind =
  'memory' | 'filesystem' | 'fs' | 'sqlite' | 'redis';

export interface CacheConfig {
  adapter?: CacheAdapterKind | CacheAdapter;
  /** Wrap the shared adapter in an in-process tier. */
  local?: boolean | { localTtl?: number; clock?: () => number };
  /** Broadcasts evictions between instances when `local` is enabled. */
  bus?: InvalidationBus;
  clock?: () => number;
  /** filesystem: cache directory. */
  directory?: string;
  /** sqlite: database file, or `:memory:`. */
  filename?: string;
  /** redis: a node-redis or ioredis compatible client. */
  client?: unknown;
  /** redis: key namespace. */
  prefix?: string;
}

export function createAdapter(
  kind: CacheAdapterKind,
  options?: Record<string, unknown>,
): Promise<CacheAdapter>;

export function resolveCache(
  config?: CacheConfig | CacheAdapter | NessCache,
): Promise<NessCache | undefined>;

export default resolveCache;
