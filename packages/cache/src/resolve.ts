import { MemoryCacheAdapter, NessCache } from './index.js';
import type { CacheAdapter } from './index.js';
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

function isAdapter(value: unknown): value is CacheAdapter {
  const candidate = value as CacheAdapter | null | undefined;
  return Boolean(
    candidate &&
    typeof candidate.get === 'function' &&
    typeof candidate.set === 'function' &&
    typeof candidate.keys === 'function',
  );
}

async function createAdapter(
  kind: CacheAdapterKind,
  options?: Record<string, unknown>,
): Promise<CacheAdapter> {
  switch (kind) {
    case 'memory':
      return new MemoryCacheAdapter(options as { clock?: () => number });
    case 'filesystem':
    case 'fs': {
      const { FileSystemCacheAdapter } =
        await import('./adapters/filesystem.js');
      return new FileSystemCacheAdapter(options as { directory?: string });
    }
    case 'sqlite': {
      const { SqliteCacheAdapter } = await import('./adapters/sqlite.js');
      return SqliteCacheAdapter.open(options as { filename?: string });
    }
    case 'redis': {
      if (!options?.['client']) {
        throw new TypeError(
          "The redis cache adapter needs a `client`. Construct it in ness.config.mjs and pass it as cache: { adapter: 'redis', client }.",
        );
      }
      const { RedisCacheAdapter } = await import('./adapters/redis.js');
      return new RedisCacheAdapter(options['client'] as object, options);
    }
    default:
      throw new TypeError(
        `Unknown cache adapter: ${String(kind)}. Use memory, filesystem, sqlite, redis, or pass an adapter instance.`,
      );
  }
}

/**
 * Turns the `cache` field of ness.config.mjs into a NessCache. Accepts a
 * ready-made cache or adapter, or a declarative description:
 *
 *   cache: { adapter: 'filesystem', directory: '.ness/cache' }
 *   cache: { adapter: 'redis', client, local: true, bus }
 *
 * `local: true` wraps the shared adapter in a memory tier so a hit costs no
 * network round trip; pass `bus` so peers evict their copies on invalidation.
 */
async function resolveCache(
  config?: CacheConfig | CacheAdapter | NessCache,
): Promise<NessCache | undefined> {
  if (!config) return undefined;
  if (config instanceof NessCache) return config;
  if (isAdapter(config)) return new NessCache(config);

  const {
    adapter = 'memory',
    local,
    bus,
    clock,
    ...options
  } = config as CacheConfig;
  const base = isAdapter(adapter)
    ? adapter
    : await createAdapter(adapter, { ...options, bus });

  if (!local) return new NessCache(base, { clock });

  const { TieredCacheAdapter } = await import('./adapters/tiered.js');
  return new NessCache(
    new TieredCacheAdapter(base, {
      bus,
      ...(typeof local === 'object' ? local : {}),
    }),
    { clock },
  );
}

export { createAdapter, resolveCache };
export default resolveCache;
