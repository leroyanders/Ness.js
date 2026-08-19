import { AsyncLocalStorage } from 'node:async_hooks';
import { getCache, hashKey, stableSerialize } from './index.js';
import type { CacheLife, CacheProfile } from './index.js';

/**
 * The runtime behind the `'use cache'` directive.
 *
 * The Vite plugin rewrites a function whose body opens with `'use cache'`
 * into a call through `__nessUseCache`, which memoizes it in the shared Ness
 * cache keyed by function identity plus arguments — the same
 * stale-while-revalidate bargain `cached()` strikes, minus the wrapping the
 * application would have written by hand.
 *
 * `cacheLife()` and `cacheTag()` are how the function body speaks to the
 * entry being written about it: they land on an AsyncLocalStorage scope the
 * wrapper opens around each real run. Called outside a `'use cache'` function
 * they do nothing, exactly like Next's.
 */
interface UseCacheScope {
  life?: CacheProfile | CacheLife;
  tags: string[];
}

const scopeStorage = new AsyncLocalStorage<UseCacheScope>();

/**
 * How long the surrounding `'use cache'` entry stays good: a named profile
 * (`'seconds'`, `'minutes'`, `'hours'`, `'days'`, `'max'`, `'default'`) or an
 * explicit `{stale, revalidate, expire}` object.
 */
function cacheLife(life: CacheProfile | CacheLife): void {
  const scope = scopeStorage.getStore();
  if (scope) scope.life = life;
}

/** Tags the surrounding `'use cache'` entry for `revalidateTag()`. */
function cacheTag(...tags: string[]): void {
  const scope = scopeStorage.getStore();
  if (scope) scope.tags.push(...tags);
}

/** Concurrent calls for one key share one run instead of racing Google-style. */
const pending = new Map<string, Promise<unknown>>();

/**
 * Wraps one `'use cache'` function. Not public API — the generated import the
 * Vite plugin injects is its only caller; the double underscore is the same
 * "generated code only" convention React uses.
 */
function __nessUseCache<Args extends unknown[], Result>(
  producer: (...args: Args) => Promise<Result>,
  id: string,
): (...args: Args) => Promise<Result> {
  return async function useCached(
    this: unknown,
    ...args: Args
  ): Promise<Result> {
    const cache = getCache();
    const key = `use-cache:${id}:${hashKey(stableSerialize(args))}`;
    const read = await cache.read<Result>(key);
    if (read.state === 'fresh' || read.state === 'stale-client')
      return read.entry.value;

    const produce = (): Promise<Result> => {
      const inFlight = pending.get(key);
      if (inFlight) return inFlight as Promise<Result>;
      const scope: UseCacheScope = { tags: [] };
      const run = scopeStorage
        .run(scope, () => producer.apply(this, args))
        .then(async value => {
          // Written after the run because the run is what declares the policy:
          // `cacheLife`/`cacheTag` execute inside the function body.
          await cache.write(key, value, {
            life: scope.life ?? 'default',
            tags: ['use-cache', ...new Set(scope.tags)],
          });
          return value;
        })
        .finally(() => pending.delete(key));
      pending.set(key, run);
      return run;
    };

    if (read.state === 'stale') {
      // Served stale while the refresh lands behind the reader — the same
      // window semantics as every other Ness cache read.
      produce().catch(() => {});
      return read.entry.value;
    }
    return produce();
  };
}

export { __nessUseCache, cacheLife, cacheTag };
