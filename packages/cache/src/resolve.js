import { MemoryCacheAdapter, NessCache } from './index.js';

function isAdapter(value) {
  return (
    value &&
    typeof value.get === 'function' &&
    typeof value.set === 'function' &&
    typeof value.keys === 'function'
  );
}

async function createAdapter(kind, options) {
  switch (kind) {
    case 'memory':
      return new MemoryCacheAdapter(options);
    case 'filesystem':
    case 'fs': {
      const { FileSystemCacheAdapter } =
        await import('./adapters/filesystem.js');
      return new FileSystemCacheAdapter(options);
    }
    case 'sqlite': {
      const { SqliteCacheAdapter } = await import('./adapters/sqlite.js');
      return SqliteCacheAdapter.open(options);
    }
    case 'redis': {
      if (!options?.client) {
        throw new TypeError(
          "The redis cache adapter needs a `client`. Construct it in ness.config.mjs and pass it as cache: { adapter: 'redis', client }.",
        );
      }
      const { RedisCacheAdapter } = await import('./adapters/redis.js');
      return new RedisCacheAdapter(options.client, options);
    }
    default:
      throw new TypeError(
        `Unknown cache adapter: ${kind}. Use memory, filesystem, sqlite, redis, or pass an adapter instance.`,
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
async function resolveCache(config) {
  if (!config) return undefined;
  if (config instanceof NessCache) return config;
  if (isAdapter(config)) return new NessCache(config);

  const { adapter = 'memory', local, bus, clock, ...options } = config;
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
