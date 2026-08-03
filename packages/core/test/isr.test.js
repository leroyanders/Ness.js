import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryCacheAdapter, NessCache, setCache } from '../src/cache/index.js';
import { createNessRequestHandler } from '../src/runtime/server.js';

const tick = () => new Promise(resolve => setImmediate(resolve));
const registerCleanup = (context, cleanup) => {
  if (typeof context.after === 'function') context.after(cleanup);
  else process.once('exit', cleanup);
};

test('page cache serves stale HTML while regenerating it in the background', async t => {
  let now = 0;
  let renders = 0;
  const cache = new NessCache(new MemoryCacheAdapter(), { clock: () => now });
  setCache(cache);
  registerCleanup(t, () => setCache(new MemoryCacheAdapter()));
  const handler = createNessRequestHandler({
    requestHandler() {
      renders += 1;
      return new Response(`<h1>render ${renders}</h1>`, {
        headers: { 'content-type': 'text/html' },
      });
    },
    cachePolicy: () => ({
      life: { stale: 0.5, revalidate: 1, expire: 10 },
      path: '/',
      tags: ['home'],
    }),
  });

  const request = new Request('http://ness.test/');
  const first = await handler(request);
  assert.equal(first.headers.get('x-ness-cache'), 'MISS');
  assert.match(await first.text(), /render 1/);
  await tick();

  now = 2_000;
  const stale = await handler(request);
  assert.equal(stale.headers.get('x-ness-cache'), 'STALE');
  assert.match(await stale.text(), /render 1/);
  await tick();

  const refreshed = await handler(request);
  assert.equal(refreshed.headers.get('x-ness-cache'), 'HIT');
  assert.match(await refreshed.text(), /render 2/);
});
