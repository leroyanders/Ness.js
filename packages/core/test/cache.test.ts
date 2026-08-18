import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MemoryCacheAdapter,
  NessCache,
  cached,
  normalizeLife,
  withCache,
} from '../dist/cache/index.js';

test('cache deduplicates concurrent work and keys calls by arguments', async () => {
  const cache = new NessCache();
  let calls = 0;
  const load = cached(
    async value => {
      calls += 1;
      return value * 2;
    },
    { key: 'double' },
  );

  const result = await withCache(cache, () =>
    Promise.all([load(2), load(2), load(3)]),
  );
  assert.deepEqual(result, [4, 4, 6]);
  assert.equal(calls, 2);
});

test('stale cache values are served while one background refresh runs', async () => {
  let now = 0;
  const adapter = new MemoryCacheAdapter({ clock: () => now });
  const cache = new NessCache(adapter, { clock: () => now });
  let value = 1;
  const load = cached(async () => value, {
    key: 'value',
    life: { stale: 0, revalidate: 5, expire: 30 },
  });

  assert.equal(await withCache(cache, load), 1);
  value = 2;
  now = 6_000;
  assert.equal(await withCache(cache, load), 1);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(await withCache(cache, load), 2);
});

test('cache invalidates tagged and nested path entries', async () => {
  const cache = new NessCache();
  await cache.write('products', [1], { tags: ['catalog'], path: '/shop' });
  await cache.write(
    'product',
    { id: 1 },
    { tags: ['product:1'], path: '/shop/1' },
  );

  assert.equal(await cache.revalidateTag('catalog'), 1);
  assert.equal((await cache.read('products')).state, 'miss');
  assert.equal(await cache.revalidatePath('/shop'), 1);
  assert.equal((await cache.read('product')).state, 'miss');
});

test('cache life rejects an expiration shorter than revalidation', () => {
  assert.throws(() => normalizeLife({ revalidate: 10, expire: 5 }), /expire/);
});
