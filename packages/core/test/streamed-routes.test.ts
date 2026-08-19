import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { streamRoute } from '../dist/runtime/client.js';

const Loading = () => h('span', null, 'skeleton');
const Page = () => h('span', null, 'page');

function tick(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test('a route with no loader is handed back untouched — loading.tsx costs nothing where there is no data', () => {
  const route = { default: Page };
  const streamed = streamRoute(route, Loading, { id: 'no-loader' });
  assert.equal(streamed.Component, Page);
  assert.equal(streamed.clientLoader, undefined);
});

test('a loader that answers inside the grace window returns its data, never the pending marker', async () => {
  const streamed = streamRoute(
    { default: Page, clientLoader: async () => ({ from: 'memory' }) },
    Loading,
    { id: 'fast' },
  );
  const data = await streamed.clientLoader({
    request: new Request('https://example.com/fast'),
  });
  assert.deepEqual(data, { from: 'memory' });
});

test('a slow loader commits the navigation immediately and hands its data over afterwards', async () => {
  let resolveLoad;
  const streamed = streamRoute(
    {
      default: Page,
      clientLoader: () =>
        new Promise(resolve => {
          resolveLoad = resolve;
        }),
    },
    Loading,
    { id: 'slow' },
  );

  const router = createMemoryRouter(
    [
      { path: '/', Component: () => h('span', null, 'home') },
      {
        path: '/slow',
        loader: streamed.clientLoader,
        Component: streamed.Component,
      },
    ],
    { initialEntries: ['/'] },
  );

  await router.navigate('/slow');
  assert.equal(
    router.state.location.pathname,
    '/slow',
    'the address must change before the data arrives',
  );
  assert.equal(router.state.navigation.state, 'idle');
  assert.match(renderToStaticMarkup(h(RouterProvider, { router })), /skeleton/);

  // What the route asks for once its load lands: the same loader, run again,
  // handing over what it kept instead of fetching a second time.
  resolveLoad({ from: 'network' });
  await tick(0);
  const handed = await streamed.clientLoader({
    request: new Request('https://example.com/slow'),
  });
  assert.deepEqual(handed, { from: 'network' });
});

test('a redirect thrown inside the grace window reaches the router, and is not thrown again at the next visit', async () => {
  let guarded = 0;
  const streamed = streamRoute(
    {
      default: Page,
      clientLoader: async () => {
        guarded += 1;
        if (guarded === 1) throw new Response(null, { status: 302 });
        return { allowed: true };
      },
    },
    Loading,
    { id: 'guard' },
  );

  await assert.rejects(() =>
    streamed.clientLoader({
      request: new Request('https://example.com/guard'),
    }),
  );
  const second = await streamed.clientLoader({
    request: new Request('https://example.com/guard'),
  });
  assert.deepEqual(
    second,
    { allowed: true },
    'the guard must run again, not replay',
  );
  assert.equal(guarded, 2);
});

test('shouldRevalidate defers to the route’s own answer outside a settle pass', () => {
  const streamed = streamRoute(
    { default: Page, clientLoader: async () => null },
    Loading,
    { id: 'revalidate', shouldRevalidate: () => false },
  );
  assert.equal(
    streamed.shouldRevalidate({
      nextUrl: new URL('https://example.com/revalidate'),
      defaultShouldRevalidate: true,
    }),
    false,
  );
});

test('a route with only a server loader is streamed through serverLoader()', async () => {
  const streamed = streamRoute({ default: Page }, Loading, {
    id: 'server',
    serverLoader: true,
  });
  const data = await streamed.clientLoader({
    request: new Request('https://example.com/server'),
    serverLoader: async () => ({ from: 'server' }),
  });
  assert.deepEqual(data, { from: 'server' });
});

/**
 * The page on screen is normally published by the route that committed; under
 * the test runner nothing renders effects, so the address stands in for it —
 * the same fallback the runtime uses before anything has committed.
 */
function setLocation(pathname, search = '') {
  globalThis.window = { location: { pathname, search } };
}

test('changing a page’s own arguments keeps the page on screen — no skeleton for a calendar’s next month', async () => {
  let loads = 0;
  const streamed = streamRoute(
    {
      default: Page,
      clientLoader: async ({ request }) => {
        loads += 1;
        await tick(30); // Slower than the grace window: this would stream.
        return { month: new URL(request.url).searchParams.get('m') };
      },
    },
    Loading,
    { id: 'calendar' },
  );

  // The reader is looking at August.
  setLocation('/dashboard/calendar', '?m=2026-08');
  const next = await streamed.clientLoader({
    request: new Request('https://example.com/dashboard/calendar?m=2026-09'),
  });

  assert.deepEqual(
    next,
    { month: '2026-09' },
    'the loader is awaited, so the page keeps rendering August until September is here',
  );
  assert.equal(loads, 1);
  delete globalThis.window;
});

test('a minimum stay widens the grace window — a load the default window would stream is returned outright', async () => {
  const streamed = streamRoute(
    {
      default: Page,
      clientLoader: async () => {
        await tick(30); // Streams at the 8ms default; inside the held window.
        return { page: 'held' };
      },
    },
    Loading,
    { id: 'held-grace', minimumMs: 400 },
  );

  setLocation('/dashboard/calendar', '?m=2026-08');
  const answer = await streamed.clientLoader({
    request: new Request('https://example.com/dashboard/held'),
  });
  assert.deepEqual(
    answer,
    { page: 'held' },
    'a load this fast must never show a skeleton it would then owe the whole stay',
  );
  delete globalThis.window;
});

test('the minimum stay defers the ask, not the answer — a claim still collects the kept result', async () => {
  let resolveLoad;
  const streamed = streamRoute(
    {
      default: Page,
      clientLoader: () =>
        new Promise(resolve => {
          resolveLoad = resolve;
        }),
    },
    Loading,
    { id: 'held-slow', minimumMs: 150 },
  );

  const router = createMemoryRouter(
    [
      { path: '/', Component: () => h('span', null, 'home') },
      {
        path: '/held-slow',
        loader: streamed.clientLoader,
        Component: streamed.Component,
      },
    ],
    { initialEntries: ['/'] },
  );

  await router.navigate('/held-slow');
  assert.match(renderToStaticMarkup(h(RouterProvider, { router })), /skeleton/);

  resolveLoad({ from: 'network' });
  await tick(0);
  const handed = await streamed.clientLoader({
    request: new Request('https://example.com/held-slow'),
  });
  assert.deepEqual(
    handed,
    { from: 'network' },
    'the hold only delays when the router is asked back, never what it collects',
  );
});

test('a different page under the same layout still streams', async () => {
  const streamed = streamRoute(
    {
      default: Page,
      clientLoader: async () => {
        await tick(30);
        return { page: 'chat' };
      },
    },
    Loading,
    { id: 'chat' },
  );

  setLocation('/dashboard/calendar', '?m=2026-08');
  const answer = await streamed.clientLoader({
    request: new Request('https://example.com/dashboard/chat'),
  });
  assert.notDeepEqual(
    answer,
    { page: 'chat' },
    'a real page change is still allowed to show its loading.tsx',
  );
  delete globalThis.window;
});
