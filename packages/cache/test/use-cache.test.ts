import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MemoryCacheAdapter,
  NessCache,
  revalidateTag,
  setCache,
} from '../dist/index.js';
import { __nessUseCache, cacheLife, cacheTag } from '../dist/use-cache.js';

function freshCache() {
  setCache(new NessCache(new MemoryCacheAdapter()));
}

test('a use-cache function runs once per distinct arguments', async () => {
  freshCache();
  let runs = 0;
  const getPosts = __nessUseCache(async (limit: number) => {
    runs += 1;
    return { limit, runs };
  }, 'test#getPosts');

  assert.deepEqual(await getPosts(5), { limit: 5, runs: 1 });
  assert.deepEqual(await getPosts(5), { limit: 5, runs: 1 });
  assert.deepEqual(await getPosts(10), { limit: 10, runs: 2 });
  assert.equal(runs, 2);
});

test('cacheTag inside the body reaches revalidateTag', async () => {
  freshCache();
  let runs = 0;
  const getPosts = __nessUseCache(async () => {
    cacheTag('posts');
    runs += 1;
    return runs;
  }, 'test#tagged');

  assert.equal(await getPosts(), 1);
  assert.equal(await getPosts(), 1);
  await revalidateTag('posts');
  assert.equal(await getPosts(), 2);
});

test('cacheLife window expires the entry', async () => {
  freshCache();
  let runs = 0;
  const now = { value: 1_000_000 };
  setCache(new NessCache(new MemoryCacheAdapter(), { clock: () => now.value }));
  const read = __nessUseCache(async () => {
    cacheLife({ stale: 1, revalidate: 1, expire: 1 });
    runs += 1;
    return runs;
  }, 'test#windowed');

  assert.equal(await read(), 1);
  assert.equal(await read(), 1);
  now.value += 5_000;
  assert.equal(await read(), 2);
});

test('concurrent calls share one run', async () => {
  freshCache();
  let runs = 0;
  const slow = __nessUseCache(async () => {
    runs += 1;
    await new Promise(resolve => setTimeout(resolve, 20));
    return runs;
  }, 'test#slow');

  const [a, b] = await Promise.all([slow(), slow()]);
  assert.equal(a, 1);
  assert.equal(b, 1);
  assert.equal(runs, 1);
});

test('cacheLife and cacheTag outside a use-cache function do nothing', () => {
  assert.doesNotThrow(() => {
    cacheLife('hours');
    cacheTag('stray');
  });
});
