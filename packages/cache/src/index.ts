import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';

export interface CacheLife {
  stale?: number;
  revalidate?: number;
  expire?: number;
}

export interface CacheEntry<T = unknown> {
  value: T;
  createdAt: number;
  life: Required<CacheLife>;
  tags: string[];
  path?: string | undefined;
}

export interface CacheAdapter {
  get(key: string): Promise<CacheEntry | undefined> | CacheEntry | undefined;
  set(key: string, entry: CacheEntry): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  keys(): Promise<string[]> | string[];
  clear(): Promise<void> | void;
  /**
   * Optional tag index. When present, `revalidateTag` resolves the affected
   * keys directly instead of scanning and reading every cached entry.
   */
  keysByTag?(tag: string): Promise<string[]> | string[];
  /** Optional path index, matching a pathname and its descendants. */
  keysByPath?(pathname: string): Promise<string[]> | string[];
}

export type CacheProfile =
  'seconds' | 'minutes' | 'hours' | 'days' | 'max' | 'default';

export interface CacheOptions<Args extends unknown[] = unknown[]> {
  key?: string;
  life?: CacheProfile | CacheLife;
  tags?: string[] | ((...args: Args) => string[]);
  path?: string | ((...args: Args) => string);
  onError?: (error: unknown) => void;
}

/** What `NessCache.read` found, and how usable it is. */
export type CacheReadResult<T = unknown> =
  | { state: 'miss'; entry?: undefined }
  | { state: 'fresh' | 'stale' | 'stale-client'; entry: CacheEntry<T> };

const CACHE_PROFILES: Readonly<Record<CacheProfile, Required<CacheLife>>> =
  Object.freeze({
    seconds: { stale: 1, revalidate: 5, expire: 30 },
    minutes: { stale: 60, revalidate: 300, expire: 3600 },
    hours: { stale: 300, revalidate: 3600, expire: 86400 },
    days: { stale: 3600, revalidate: 86400, expire: 604800 },
    max: { stale: 31536000, revalidate: 31536000, expire: Infinity },
    default: { stale: 300, revalidate: 900, expire: Infinity },
  });

const cacheStorage = new AsyncLocalStorage<NessCache>();

function stableSerialize(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'function')
    return `[Function:${value.name || 'anonymous'}]`;
  if (typeof value === 'symbol') return value.toString();
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (seen.has(value))
    throw new TypeError(
      'Cannot cache arguments containing circular references.',
    );
  seen.add(value);
  let serialized: string;
  if (Array.isArray(value)) {
    serialized = `[${value.map(item => stableSerialize(item, seen)).join(',')}]`;
  } else if (value instanceof Date) {
    serialized = `Date(${value.toISOString()})`;
  } else if (value instanceof URL) {
    serialized = `URL(${value.href})`;
  } else if (value instanceof Map) {
    // Object.keys is empty for a Map, so without this every Map argument
    // serializes to '{}' and distinct arguments share one cache key.
    serialized = `Map(${[...value.entries()]
      .map(([entryKey, entryValue]) => [
        stableSerialize(entryKey, seen),
        stableSerialize(entryValue, seen),
      ])
      .sort(([left], [right]) => (left! < right! ? -1 : left! > right! ? 1 : 0))
      .map(pair => pair.join(':'))
      .join(',')})`;
  } else if (value instanceof Set) {
    serialized = `Set(${[...value]
      .map(item => stableSerialize(item, seen))
      .sort()
      .join(',')})`;
  } else {
    const record = value as Record<string, unknown>;
    serialized = `{${Object.keys(record)
      .sort()
      .map(
        key => `${JSON.stringify(key)}:${stableSerialize(record[key], seen)}`,
      )
      .join(',')}}`;
  }
  seen.delete(value);
  return serialized;
}

function hashKey(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeLife(
  life: CacheProfile | CacheLife = 'default',
): Required<CacheLife> {
  const profile: CacheLife | undefined =
    typeof life === 'string' ? CACHE_PROFILES[life] : life;
  if (!profile) throw new TypeError(`Unknown cache profile: ${String(life)}`);
  const normalized: Required<CacheLife> = {
    stale: Number(profile.stale ?? 0),
    revalidate: Number(profile.revalidate ?? profile.stale ?? 0),
    expire:
      profile.expire === Infinity
        ? Infinity
        : Number(profile.expire ?? Infinity),
  };
  if (
    normalized.stale < 0 ||
    normalized.revalidate < 0 ||
    normalized.expire < 0
  ) {
    throw new TypeError('Cache profile values cannot be negative.');
  }
  if (normalized.expire < normalized.revalidate) {
    throw new TypeError(
      'Cache expire must be greater than or equal to revalidate.',
    );
  }
  return normalized;
}

function matchesPath(entryPath: string | undefined, pathname: string): boolean {
  if (!entryPath) return false;
  if (entryPath === pathname) return true;
  // Without this, '/' would build the prefix '//' and match nothing.
  const prefix = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return entryPath.startsWith(prefix);
}

class MemoryCacheAdapter implements CacheAdapter {
  clock: () => number;
  entries: Map<string, CacheEntry>;
  pending: Map<string, Promise<unknown>>;
  tagIndex: Map<string, Set<string>>;
  pathIndex: Map<string, Set<string>>;

  constructor({ clock = Date.now }: { clock?: () => number } = {}) {
    this.clock = clock;
    this.entries = new Map();
    this.pending = new Map();
    this.tagIndex = new Map();
    this.pathIndex = new Map();
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    return this.entries.get(key);
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    this.#unindex(key);
    this.entries.set(key, entry);
    for (const tag of entry.tags || []) {
      let keys = this.tagIndex.get(tag);
      if (!keys) {
        keys = new Set();
        this.tagIndex.set(tag, keys);
      }
      keys.add(key);
    }
    if (entry.path) {
      let keys = this.pathIndex.get(entry.path);
      if (!keys) {
        keys = new Set();
        this.pathIndex.set(entry.path, keys);
      }
      keys.add(key);
    }
  }

  async delete(key: string): Promise<void> {
    this.#unindex(key);
    this.entries.delete(key);
  }

  async keys(): Promise<string[]> {
    return [...this.entries.keys()];
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.pending.clear();
    this.tagIndex.clear();
    this.pathIndex.clear();
  }

  async keysByTag(tag: string): Promise<string[]> {
    return [...(this.tagIndex.get(tag) || [])];
  }

  async keysByPath(pathname: string): Promise<string[]> {
    const matched: string[] = [];
    for (const [indexed, keys] of this.pathIndex) {
      if (matchesPath(indexed, pathname)) matched.push(...keys);
    }
    return matched;
  }

  #unindex(key: string): void {
    const previous = this.entries.get(key);
    if (!previous) return;
    for (const tag of previous.tags || []) {
      const keys = this.tagIndex.get(tag);
      if (!keys) continue;
      keys.delete(key);
      if (keys.size === 0) this.tagIndex.delete(tag);
    }
    if (previous.path) {
      const keys = this.pathIndex.get(previous.path);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) this.pathIndex.delete(previous.path);
      }
    }
  }
}

class NessCache {
  adapter: CacheAdapter;
  clock: () => number;
  pending: Map<string, Promise<unknown>>;

  constructor(
    adapter: CacheAdapter = new MemoryCacheAdapter(),
    { clock = Date.now }: { clock?: () => number } = {},
  ) {
    this.adapter = adapter;
    this.clock = clock;
    this.pending = new Map();
  }

  async read<T = unknown>(key: string): Promise<CacheReadResult<T>> {
    const entry = (await this.adapter.get(key)) as CacheEntry<T> | undefined;
    if (!entry) return { state: 'miss' };
    const age = (this.clock() - entry.createdAt) / 1000;
    if (age >= entry.life.expire) {
      await this.adapter.delete(key);
      return { state: 'miss' };
    }
    if (age >= entry.life.revalidate) return { state: 'stale', entry };
    return { state: age >= entry.life.stale ? 'stale-client' : 'fresh', entry };
  }

  async write<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<T> {
    const entry: CacheEntry<T> = {
      value,
      createdAt: this.clock(),
      life: normalizeLife(options.life),
      tags: [...new Set(options.tags as string[] | undefined)],
      path: options.path as string | undefined,
    };
    await this.adapter.set(key, entry as CacheEntry);
    return value;
  }

  async getOrSet<T>(
    key: string,
    producer: () => Promise<T> | T,
    options: CacheOptions = {},
  ): Promise<T> {
    const result = await this.read<T>(key);
    if (result.state === 'fresh' || result.state === 'stale-client')
      return result.entry.value;
    if (result.state === 'stale') {
      this.refresh(key, producer, options).catch(options.onError || (() => {}));
      return result.entry.value;
    }
    return this.refresh(key, producer, options);
  }

  async refresh<T>(
    key: string,
    producer: () => Promise<T> | T,
    options: CacheOptions = {},
  ): Promise<T> {
    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight as Promise<T>;
    const pending = Promise.resolve()
      .then(producer)
      .then(value => this.write(key, value, options))
      .finally(() => this.pending.delete(key));
    this.pending.set(key, pending);
    return pending;
  }

  async invalidate(
    predicate: (entry: CacheEntry, key: string) => boolean,
  ): Promise<number> {
    let removed = 0;
    for (const key of await this.adapter.keys()) {
      const entry = await this.adapter.get(key);
      if (entry && predicate(entry, key)) {
        await this.adapter.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  /**
   * An index is a list of candidates, not the truth. The entry itself decides:
   * a shared store can outlive its index (a key expires by TTL while its tag
   * set does not), and deleting on index membership alone would then evict an
   * entry that never carried the tag.
   */
  async #deleteKeys(
    keys: string[],
    matches: (entry: CacheEntry) => boolean,
  ): Promise<number> {
    let removed = 0;
    for (const key of new Set(keys)) {
      const entry = await this.adapter.get(key);
      if (!entry || !matches(entry)) continue;
      await this.adapter.delete(key);
      removed += 1;
    }
    return removed;
  }

  async revalidateTag(tag: string): Promise<number> {
    const matches = (entry: CacheEntry) => (entry.tags || []).includes(tag);
    if (typeof this.adapter.keysByTag === 'function') {
      const candidates = await this.adapter.keysByTag(tag);
      if (candidates) return this.#deleteKeys(candidates, matches);
    }
    return this.invalidate(matches);
  }

  async revalidatePath(pathname: string): Promise<number> {
    const matches = (entry: CacheEntry) => matchesPath(entry.path, pathname);
    if (typeof this.adapter.keysByPath === 'function') {
      const candidates = await this.adapter.keysByPath(pathname);
      if (candidates) return this.#deleteKeys(candidates, matches);
    }
    return this.invalidate(matches);
  }

  delete(key: string): Promise<void> | void {
    return this.adapter.delete(key);
  }

  clear(): Promise<void> | void {
    return this.adapter.clear();
  }
}

let defaultCache = new NessCache();

function getCache(): NessCache {
  return cacheStorage.getStore() || defaultCache;
}

function setCache(cacheOrAdapter: NessCache | CacheAdapter): NessCache {
  defaultCache =
    cacheOrAdapter instanceof NessCache
      ? cacheOrAdapter
      : new NessCache(cacheOrAdapter);
  return defaultCache;
}

function withCache<T>(cache: NessCache, callback: () => T): T {
  return cacheStorage.run(cache, callback);
}

function cached<Args extends unknown[], Result>(
  producer: (...args: Args) => Promise<Result> | Result,
  options: CacheOptions<Args> = {},
): (...args: Args) => Promise<Awaited<Result>> {
  if (typeof producer !== 'function')
    throw new TypeError('cached() expects a function.');
  const namespace = options.key || producer.name || 'anonymous';
  return async function cachedFunction(
    this: unknown,
    ...args: Args
  ): Promise<Awaited<Result>> {
    const serialized = stableSerialize(args);
    const key = `${namespace}:${hashKey(serialized)}`;
    const tags =
      typeof options.tags === 'function' ? options.tags(...args) : options.tags;
    const pathname =
      typeof options.path === 'function' ? options.path(...args) : options.path;
    return getCache().getOrSet(
      key,
      () => producer.apply(this, args) as Promise<Awaited<Result>>,
      { ...(options as CacheOptions), tags, path: pathname },
    );
  };
}

function revalidateTag(tag: string): Promise<number> {
  return getCache().revalidateTag(tag);
}

function updateTag(tag: string): Promise<number> {
  return revalidateTag(tag);
}

function revalidatePath(pathname: string): Promise<number> {
  return getCache().revalidatePath(pathname);
}

export {
  CACHE_PROFILES,
  MemoryCacheAdapter,
  NessCache,
  cached,
  getCache,
  hashKey,
  normalizeLife,
  revalidatePath,
  revalidateTag,
  setCache,
  stableSerialize,
  updateTag,
  withCache,
};
// The `'use cache'` runtime: re-exported here so application code imports
// `cacheLife`/`cacheTag` from the package it already knows. A cycle on paper
// (use-cache imports `getCache` from this module), but both sides only touch
// the other inside function bodies, so initialization order cannot bite.
export { cacheLife, cacheTag } from './use-cache.js';
