import assert from 'node:assert/strict';
import test from 'node:test';
import { cacheRoute, clearClientCache } from '../dist/runtime/client.js';

const Page = () => null;

test('a route with no loader is handed back untouched', () => {
  const route = { default: Page };
  const cached = cacheRoute(route, { id: 'no-loader' });
  assert.equal(cached.Component, Page);
  assert.equal(cached.clientLoader, undefined);
});

test('within the clientCache window a repeat navigation is answered from memory', async () => {
  clearClientCache();
  let loads = 0;
  const cached = cacheRoute(
    {
      default: Page,
      clientCache: 60,
      clientLoader: async () => ({ visit: ++loads }),
    },
    { id: 'ttl' },
  );

  const first = await cached.clientLoader({
    request: new Request('https://example.com/ttl-page'),
  });
  assert.deepEqual(first, { visit: 1 });

  const second = await cached.clientLoader({
    request: new Request('https://example.com/ttl-page'),
  });
  assert.deepEqual(second, { visit: 1 }, 'the loader must not have re-run');
  assert.equal(loads, 1);
});

test('past the window the last answer is served stale, once', async () => {
  clearClientCache();
  let loads = 0;
  const cached = cacheRoute(
    {
      default: Page,
      // 1ms, so the test does not have to wait a real window out.
      clientCache: 0.001,
      clientLoader: async () => ({ visit: ++loads }),
    },
    { id: 'expiry' },
  );

  await cached.clientLoader({
    request: new Request('https://example.com/expiring'),
  });
  await new Promise(resolve => setTimeout(resolve, 10));
  // Past the window the entry is still what the reader saw a moment ago: it
  // is served one more time as a stale answer that owes a refresh, instead
  // of putting a wait in front of the navigation.
  const second = await cached.clientLoader({
    request: new Request('https://example.com/expiring'),
  });
  assert.deepEqual(second, { visit: 1 }, 'stale is served in a frame');
  // The stale service consumed the expired entry, so the next ask — the
  // refresh it owes — reaches the loader.
  const third = await cached.clientLoader({
    request: new Request('https://example.com/expiring'),
  });
  assert.deepEqual(third, { visit: 2 });
});

test('clientCache = 0 opts a page out of the application default', async () => {
  clearClientCache();
  let loads = 0;
  const cached = cacheRoute(
    {
      default: Page,
      clientCache: 0,
      clientLoader: async () => ({ visit: ++loads }),
    },
    { id: 'opt-out', defaultSeconds: 60 },
  );

  await cached.clientLoader({
    request: new Request('https://example.com/opted-out'),
  });
  await cached.clientLoader({
    request: new Request('https://example.com/opted-out'),
  });
  assert.equal(loads, 2, 'every navigation must reach the loader');
});

test('the application default applies when the page states nothing', async () => {
  clearClientCache();
  let loads = 0;
  const cached = cacheRoute(
    {
      default: Page,
      clientLoader: async () => ({ visit: ++loads }),
    },
    { id: 'app-default', defaultSeconds: 60 },
  );

  await cached.clientLoader({
    request: new Request('https://example.com/defaulted'),
  });
  const second = await cached.clientLoader({
    request: new Request('https://example.com/defaulted'),
  });
  assert.deepEqual(second, { visit: 1 });
  assert.equal(loads, 1);
});

test('a layout and a page under the same URL keep separate data', async () => {
  clearClientCache();
  const layout = cacheRoute(
    {
      default: Page,
      clientCache: 60,
      clientLoader: async () => ({ from: 'layout' }),
    },
    { id: 'shared__layout' },
  );
  const page = cacheRoute(
    {
      default: Page,
      clientCache: 60,
      clientLoader: async () => ({ from: 'page' }),
    },
    { id: 'shared__page' },
  );
  const args = () => ({ request: new Request('https://example.com/shared') });

  await layout.clientLoader(args());
  await page.clientLoader(args());
  // Second visits are answered from memory — each from its own shelf.
  assert.deepEqual(await layout.clientLoader(args()), { from: 'layout' });
  assert.deepEqual(await page.clientLoader(args()), { from: 'page' });
});

test('a route without its own clientLoader reaches through to serverLoader', async () => {
  clearClientCache();
  let serverCalls = 0;
  const cached = cacheRoute(
    { default: Page, clientCache: 60 },
    { id: 'server-backed', serverLoader: true },
  );

  const args = () => ({
    request: new Request('https://example.com/server-backed'),
    serverLoader: async () => ({ call: ++serverCalls }),
  });
  assert.deepEqual(await cached.clientLoader(args()), { call: 1 });
  assert.deepEqual(
    await cached.clientLoader(args()),
    { call: 1 },
    'the second navigation must not have fetched the server loader',
  );
  assert.equal(serverCalls, 1);
});

test('clearClientCache empties the window — the mutation contract', async () => {
  clearClientCache();
  let loads = 0;
  const cached = cacheRoute(
    {
      default: Page,
      clientCache: 60,
      clientLoader: async () => ({ visit: ++loads }),
    },
    { id: 'mutated' },
  );

  await cached.clientLoader({
    request: new Request('https://example.com/mutated'),
  });
  clearClientCache();
  const second = await cached.clientLoader({
    request: new Request('https://example.com/mutated'),
  });
  assert.deepEqual(second, { visit: 2 });
});
