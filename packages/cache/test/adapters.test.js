import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  MemoryCacheAdapter,
  NessCache,
  cached,
  normalizeLife,
  withCache,
} from '../src/index.js';
import { FileSystemCacheAdapter } from '../src/adapters/filesystem.js';
import { RedisCacheAdapter } from '../src/adapters/redis.js';
import {
  TieredCacheAdapter,
  createRedisInvalidationBus,
} from '../src/adapters/tiered.js';

function entry(value, { tags = [], path: pathname, life = 'default' } = {}) {
  return {
    value,
    createdAt: 0,
    life: normalizeLife(life),
    tags,
    path: pathname,
  };
}

/**
 * Minimal in-memory stand-in for node-redis. It only implements the commands
 * RedisCacheAdapter uses, which is exactly what we want to pin down: the
 * adapter must not reach for anything else.
 */
class FakeRedis {
  constructor() {
    this.strings = new Map();
    this.sets = new Map();
    this.expiries = new Map();
  }

  async get(key) {
    return this.strings.has(key) ? this.strings.get(key) : null;
  }

  async set(key, value, options) {
    this.strings.set(key, value);
    if (options?.PX) this.expiries.set(key, options.PX);
    return 'OK';
  }

  async del(key) {
    this.strings.delete(key);
    this.sets.delete(key);
    return 1;
  }

  async sAdd(key, member) {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    this.sets.get(key).add(member);
    return 1;
  }

  async sRem(key, member) {
    this.sets.get(key)?.delete(member);
    return 1;
  }

  async sMembers(key) {
    return [...(this.sets.get(key) || [])];
  }

  async scan(cursor, { MATCH, COUNT }) {
    const pattern = new RegExp(`^${MATCH.replaceAll('*', '.*')}$`);
    const all = [...this.strings.keys()].filter(key => pattern.test(key));
    const next = cursor + COUNT;
    return {
      cursor: next >= all.length ? 0 : next,
      keys: all.slice(cursor, next),
    };
  }
}

const ADAPTERS = [
  ['memory', async () => ({ adapter: new MemoryCacheAdapter() })],
  [
    'filesystem',
    async () => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-cache-'));
      return {
        adapter: new FileSystemCacheAdapter({ directory }),
        cleanup: () => fs.rmSync(directory, { recursive: true, force: true }),
      };
    },
  ],
  ['redis', async () => ({ adapter: new RedisCacheAdapter(new FakeRedis()) })],
];

for (const [name, create] of ADAPTERS) {
  test(`${name} adapter satisfies the cache adapter contract`, async t => {
    const { adapter, cleanup } = await create();
    if (cleanup) t.after(cleanup);

    await adapter.set('a', entry(1, { tags: ['posts'], path: '/blog' }));
    await adapter.set('b', entry(2, { tags: ['posts', 'authors'] }));

    assert.deepEqual((await adapter.get('a')).value, 1);
    assert.deepEqual((await adapter.keys()).sort(), ['a', 'b']);
    assert.deepEqual((await adapter.keysByTag('posts')).sort(), ['a', 'b']);
    assert.deepEqual(await adapter.keysByTag('authors'), ['b']);
    assert.deepEqual(await adapter.keysByPath('/blog'), ['a']);

    await adapter.delete('a');
    assert.equal(await adapter.get('a'), undefined);
    assert.deepEqual(await adapter.keysByTag('posts'), ['b']);

    await adapter.clear();
    assert.deepEqual(await adapter.keys(), []);
  });

  test(`${name} adapter preserves infinite expiry across serialization`, async t => {
    const { adapter, cleanup } = await create();
    if (cleanup) t.after(cleanup);

    await adapter.set('forever', entry('value', { life: 'max' }));
    assert.equal((await adapter.get('forever')).life.expire, Infinity);
  });

  test(`${name} adapter reindexes tags when an entry is overwritten`, async t => {
    const { adapter, cleanup } = await create();
    if (cleanup) t.after(cleanup);

    await adapter.set('k', entry(1, { tags: ['old'], path: '/old' }));
    await adapter.set('k', entry(2, { tags: ['new'], path: '/new' }));

    assert.deepEqual(await adapter.keysByTag('old'), []);
    assert.deepEqual(await adapter.keysByTag('new'), ['k']);
    assert.deepEqual(await adapter.keysByPath('/old'), []);
    assert.deepEqual(await adapter.keysByPath('/new'), ['k']);
  });
}

test('tag invalidation uses the index instead of scanning every entry', async () => {
  const adapter = new MemoryCacheAdapter();
  let scans = 0;
  const originalKeys = adapter.keys.bind(adapter);
  adapter.keys = async () => {
    scans += 1;
    return originalKeys();
  };
  const cache = new NessCache(adapter);

  await cache.write('a', 1, { tags: ['posts'] });
  await cache.write('b', 2, { tags: ['pages'] });

  assert.equal(await cache.revalidateTag('posts'), 1);
  assert.equal(await cache.getOrSet('b', () => 99), 2);
  assert.equal(scans, 0, 'revalidateTag must not enumerate the whole cache');
});

test('path invalidation removes descendants but not siblings', async () => {
  const cache = new NessCache(new MemoryCacheAdapter());
  await cache.write('root', 1, { path: '/blog' });
  await cache.write('child', 2, { path: '/blog/post' });
  await cache.write('sibling', 3, { path: '/blogroll' });

  assert.equal(await cache.revalidatePath('/blog'), 2);
  assert.equal(await cache.getOrSet('sibling', () => 99), 3);
});

test('adapters without an index still invalidate by scanning', async () => {
  const memory = new MemoryCacheAdapter();
  const unindexed = {
    get: key => memory.get(key),
    set: (key, value) => memory.set(key, value),
    delete: key => memory.delete(key),
    keys: () => memory.keys(),
    clear: () => memory.clear(),
  };
  const cache = new NessCache(unindexed);

  await cache.write('a', 1, { tags: ['posts'] });
  await cache.write('b', 2, { path: '/blog/post' });

  assert.equal(await cache.revalidateTag('posts'), 1);
  assert.equal(await cache.revalidatePath('/blog'), 1);
});

test('tiered adapter serves from the local tier and falls back to the shared one', async () => {
  const shared = new MemoryCacheAdapter();
  const local = new MemoryCacheAdapter();
  const tiered = new TieredCacheAdapter(shared, { local, localTtl: Infinity });

  await shared.set('remote', entry('written-elsewhere'));
  assert.equal((await tiered.get('remote')).value, 'written-elsewhere');
  assert.equal(
    (await local.get('remote')).value,
    'written-elsewhere',
    'a shared hit should populate the local tier',
  );

  await tiered.set('own', entry('written-here'));
  assert.equal((await shared.get('own')).value, 'written-here');
});

test('tiered adapter expires local copies once localTtl elapses', async () => {
  const shared = new MemoryCacheAdapter();
  const local = new MemoryCacheAdapter();
  let now = 0;
  const tiered = new TieredCacheAdapter(shared, {
    local,
    localTtl: 5,
    clock: () => now,
  });

  await tiered.set('key', entry('first'));
  // Another instance replaces the entry; this one still holds the old copy.
  await shared.set('key', entry('second'));
  assert.equal((await tiered.get('key')).value, 'first');

  now = 6_000;
  assert.equal(
    (await tiered.get('key')).value,
    'second',
    'a local copy older than localTtl must be revalidated against the shared store',
  );
});

test('an invalidation bus evicts local copies on other instances', async () => {
  const shared = new MemoryCacheAdapter();
  const handlers = [];
  const bus = () => ({
    publish: message => {
      for (const handler of handlers) handler(message);
    },
    subscribe: handler => {
      handlers.push(handler);
      return () => {};
    },
  });

  const one = new TieredCacheAdapter(shared, {
    bus: bus(),
    localTtl: Infinity,
  });
  const two = new TieredCacheAdapter(shared, {
    bus: bus(),
    localTtl: Infinity,
  });

  await one.set('key', entry('v1'));
  assert.equal((await two.get('key')).value, 'v1');

  await two.delete('key');
  assert.equal(
    await one.get('key'),
    undefined,
    'the peer must drop its local copy when another instance invalidates',
  );
});

test('the redis invalidation bus ignores messages it published itself', async () => {
  const listeners = [];
  // node-redis shape: subscribe() takes the message listener directly, and
  // pSubscribe is what distinguishes it from ioredis.
  const client = {
    publish: (_channel, payload) => {
      for (const listener of listeners) listener(payload);
    },
    subscribe: (_channel, listener) => {
      listeners.push(listener);
    },
    pSubscribe: () => {},
  };
  const bus = createRedisInvalidationBus(client, client, { id: 'instance-1' });
  const received = [];
  bus.subscribe(message => received.push(message));

  await bus.publish({ type: 'evict', key: 'own' });
  listeners[0](
    JSON.stringify({ type: 'evict', key: 'peer', id: 'instance-2' }),
  );

  assert.deepEqual(
    received.map(message => message.key),
    ['peer'],
  );
});

/* Regressions found by adversarial review of the adapters. */

test('concurrent writes of the same key do not collide on a temp file', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-cache-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const adapter = new FileSystemCacheAdapter({ directory });

  // A cache stampede after an invalidation: several requests miss and all
  // write the same key at once.
  await Promise.all([
    adapter.set('k', entry('a')),
    adapter.set('k', entry('b')),
    adapter.set('k', entry('c')),
  ]);

  const stored = await adapter.get('k');
  assert.ok(['a', 'b', 'c'].includes(stored.value), 'one writer wins cleanly');
  assert.deepEqual(
    fs
      .readdirSync(path.join(directory, 'entries'))
      .filter(f => f.endsWith('.tmp')),
    [],
    'no temp file is left behind',
  );
});

test('an index entry that no longer carries the tag is not deleted', async () => {
  const adapter = new MemoryCacheAdapter();
  const cache = new NessCache(adapter);
  await cache.write('k', 'v1', { tags: ['old'] });

  // Simulate a shared store whose index outlived the entry: the key is still
  // listed under the old tag, but the entry itself has been rewritten.
  const stale = adapter.keysByTag.bind(adapter);
  adapter.keysByTag = async tag =>
    tag === 'old' ? ['k', ...(await stale(tag))] : stale(tag);
  await cache.write('k', 'v2', { tags: ['new'] });

  assert.equal(await cache.revalidateTag('old'), 0);
  assert.equal((await adapter.get('k')).value, 'v2', 'the entry survives');
  assert.equal(await cache.revalidateTag('new'), 1);
});

test('a tiered adapter over an unindexed store still invalidates by scanning', async () => {
  const memory = new MemoryCacheAdapter();
  const unindexed = {
    get: key => memory.get(key),
    set: (key, value) => memory.set(key, value),
    delete: key => memory.delete(key),
    keys: () => memory.keys(),
    clear: () => memory.clear(),
  };
  const cache = new NessCache(new TieredCacheAdapter(unindexed));

  await cache.write('a', 1, { tags: ['posts'] });
  await cache.write('b', 2, { path: '/blog/post' });

  assert.equal(
    await cache.revalidateTag('posts'),
    1,
    'wrapping must not advertise an index the shared store cannot back',
  );
  assert.equal(await cache.revalidatePath('/blog'), 1);
});

test("revalidatePath('/') invalidates the whole tree", async () => {
  const cache = new NessCache(new MemoryCacheAdapter());
  await cache.write('home', 1, { path: '/' });
  await cache.write('deep', 2, { path: '/blog/post' });

  assert.equal(await cache.revalidatePath('/'), 2);
});

test('Map and Set arguments produce distinct cache keys', async () => {
  const cache = new NessCache(new MemoryCacheAdapter());
  const calls = [];
  const load = cached(
    async value => {
      calls.push(value);
      return calls.length;
    },
    { key: 'collection' },
  );

  await withCache(cache, async () => {
    await load(new Map([['a', 1]]));
    await load(new Map([['b', 2]]));
    await load(new Set([1]));
    await load(new Set([2]));
  });

  assert.equal(calls.length, 4, 'each distinct collection is its own key');
});

test('the redis bus tolerates an ioredis subscriber', () => {
  const listeners = [];
  // ioredis: subscribe() takes a completion callback, messages arrive as events.
  const subscriber = {
    subscribe: (_channel, done) => {
      done?.(null, 1);
      return Promise.resolve(1);
    },
    on: (event, listener) => {
      if (event === 'message') listeners.push(listener);
    },
  };
  const publisher = { publish: () => Promise.resolve(1) };
  const bus = createRedisInvalidationBus(publisher, subscriber, { id: 'self' });

  const received = [];
  assert.doesNotThrow(() => bus.subscribe(message => received.push(message)));

  listeners[0](
    'ness:cache:invalidate',
    JSON.stringify({ type: 'evict', key: 'peer', id: 'other' }),
  );
  assert.deepEqual(
    received.map(message => message.key),
    ['peer'],
  );
});
