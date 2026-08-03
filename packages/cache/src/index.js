import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';

const CACHE_PROFILES = Object.freeze({
  seconds: { stale: 1, revalidate: 5, expire: 30 },
  minutes: { stale: 60, revalidate: 300, expire: 3600 },
  hours: { stale: 300, revalidate: 3600, expire: 86400 },
  days: { stale: 3600, revalidate: 86400, expire: 604800 },
  max: { stale: 31536000, revalidate: 31536000, expire: Infinity },
  default: { stale: 300, revalidate: 900, expire: Infinity },
});

const cacheStorage = new AsyncLocalStorage();

function stableSerialize(value, seen = new WeakSet()) {
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
  let serialized;
  if (Array.isArray(value)) {
    serialized = `[${value.map(item => stableSerialize(item, seen)).join(',')}]`;
  } else if (value instanceof Date) {
    serialized = `Date(${value.toISOString()})`;
  } else if (value instanceof URL) {
    serialized = `URL(${value.href})`;
  } else {
    serialized = `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableSerialize(value[key], seen)}`)
      .join(',')}}`;
  }
  seen.delete(value);
  return serialized;
}

function hashKey(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeLife(life = 'default') {
  const profile = typeof life === 'string' ? CACHE_PROFILES[life] : life;
  if (!profile) throw new TypeError(`Unknown cache profile: ${life}`);
  const normalized = {
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

class MemoryCacheAdapter {
  constructor({ clock = Date.now } = {}) {
    this.clock = clock;
    this.entries = new Map();
    this.pending = new Map();
  }

  async get(key) {
    return this.entries.get(key);
  }

  async set(key, entry) {
    this.entries.set(key, entry);
  }

  async delete(key) {
    this.entries.delete(key);
  }

  async keys() {
    return [...this.entries.keys()];
  }

  async clear() {
    this.entries.clear();
    this.pending.clear();
  }
}

class NessCache {
  constructor(adapter = new MemoryCacheAdapter(), { clock = Date.now } = {}) {
    this.adapter = adapter;
    this.clock = clock;
    this.pending = new Map();
  }

  async read(key) {
    const entry = await this.adapter.get(key);
    if (!entry) return { state: 'miss' };
    const age = (this.clock() - entry.createdAt) / 1000;
    if (age >= entry.life.expire) {
      await this.adapter.delete(key);
      return { state: 'miss' };
    }
    if (age >= entry.life.revalidate) return { state: 'stale', entry };
    return { state: age >= entry.life.stale ? 'stale-client' : 'fresh', entry };
  }

  async write(key, value, options = {}) {
    const entry = {
      value,
      createdAt: this.clock(),
      life: normalizeLife(options.life),
      tags: [...new Set(options.tags || [])],
      path: options.path,
    };
    await this.adapter.set(key, entry);
    return value;
  }

  async getOrSet(key, producer, options = {}) {
    const result = await this.read(key);
    if (result.state === 'fresh' || result.state === 'stale-client')
      return result.entry.value;
    if (result.state === 'stale') {
      this.refresh(key, producer, options).catch(options.onError || (() => {}));
      return result.entry.value;
    }
    return this.refresh(key, producer, options);
  }

  async refresh(key, producer, options = {}) {
    if (this.pending.has(key)) return this.pending.get(key);
    const pending = Promise.resolve()
      .then(producer)
      .then(value => this.write(key, value, options))
      .finally(() => this.pending.delete(key));
    this.pending.set(key, pending);
    return pending;
  }

  async invalidate(predicate) {
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

  revalidateTag(tag) {
    return this.invalidate(entry => entry.tags.includes(tag));
  }

  revalidatePath(pathname) {
    return this.invalidate(
      entry =>
        entry.path === pathname ||
        (entry.path && entry.path.startsWith(`${pathname}/`)),
    );
  }

  delete(key) {
    return this.adapter.delete(key);
  }

  clear() {
    return this.adapter.clear();
  }
}

let defaultCache = new NessCache();

function getCache() {
  return cacheStorage.getStore() || defaultCache;
}

function setCache(cacheOrAdapter) {
  defaultCache =
    cacheOrAdapter instanceof NessCache
      ? cacheOrAdapter
      : new NessCache(cacheOrAdapter);
  return defaultCache;
}

function withCache(cache, callback) {
  return cacheStorage.run(cache, callback);
}

function cached(producer, options = {}) {
  if (typeof producer !== 'function')
    throw new TypeError('cached() expects a function.');
  const namespace = options.key || producer.name || 'anonymous';
  return async function cachedFunction(...args) {
    const serialized = stableSerialize(args);
    const key = `${namespace}:${hashKey(serialized)}`;
    const tags =
      typeof options.tags === 'function' ? options.tags(...args) : options.tags;
    const pathname =
      typeof options.path === 'function' ? options.path(...args) : options.path;
    return getCache().getOrSet(key, () => producer.apply(this, args), {
      ...options,
      tags,
      path: pathname,
    });
  };
}

function revalidateTag(tag) {
  return getCache().revalidateTag(tag);
}

function updateTag(tag) {
  return revalidateTag(tag);
}

function revalidatePath(pathname) {
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
