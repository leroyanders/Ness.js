import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { RouteOutlet, apiFetch, cachedClientLoader, clearClientCache } from '../src/runtime/client.js';

/**
 * `cachedClientLoader` reads `window.location` — not present under Node's
 * test runner without a DOM. A tiny mutable stand-in is enough; nothing
 * else in this file needs a real `window`.
 */
function setLocation(pathname, search = '') {
  globalThis.window = { location: { pathname, search } };
}

test('apiFetch is a plain fetch pass-through, same name/shape as the server helper', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = (path, init) => {
    calls.push({ path, init });
    return Promise.resolve(new Response(JSON.stringify({ ok: true })));
  };
  try {
    const response = await apiFetch('/api/contacts', { method: 'GET' });
    assert.deepEqual(await response.json(), { ok: true });
    assert.deepEqual(calls, [{ path: '/api/contacts', init: { method: 'GET' } }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cachedClientLoader calls through and caches on a miss', async () => {
  setLocation('/current');
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return { calls };
  };
  const wrapped = cachedClientLoader(loader);

  const result = await wrapped({ request: new Request('https://example.com/other') });
  assert.deepEqual(result, { calls: 1 });
  assert.equal(calls, 1);
});

test('cachedClientLoader returns the cached value for a different URL without re-calling the loader', async () => {
  setLocation('/current');
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return { calls };
  };
  const wrapped = cachedClientLoader(loader);

  const first = await wrapped({ request: new Request('https://example.com/target?x=1') });
  const second = await wrapped({ request: new Request('https://example.com/target?x=1') });
  assert.equal(calls, 1);
  assert.equal(second, first);
});

test('cachedClientLoader always re-fetches when request.url matches window.location (a revalidation, not a navigation)', async () => {
  // Prime the cache as if `/current` had been navigated to earlier.
  setLocation('/elsewhere');
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return { calls };
  };
  const wrapped = cachedClientLoader(loader);
  await wrapped({ request: new Request('https://example.com/current') });
  assert.equal(calls, 1);

  // Now simulate having arrived at /current (window.location matches it) and
  // React Router revalidating that same route after a mutation.
  setLocation('/current');
  const revalidated = await wrapped({ request: new Request('https://example.com/current') });
  assert.equal(calls, 2, 'a same-URL revalidation must never be served from cache');
  assert.deepEqual(revalidated, { calls: 2 });
});

test('cachedClientLoader treats different search params as distinct cache entries', async () => {
  setLocation('/elsewhere');
  let calls = 0;
  const loader = async ({ request }) => {
    calls += 1;
    return { calls, url: request.url };
  };
  const wrapped = cachedClientLoader(loader);

  await wrapped({ request: new Request('https://example.com/board?b=1') });
  await wrapped({ request: new Request('https://example.com/board?b=2') });
  assert.equal(calls, 2);

  const revisit = await wrapped({ request: new Request('https://example.com/board?b=1') });
  assert.equal(calls, 2, 'revisiting an already-cached ?b=1 must not re-fetch');
  assert.match(revisit.url, /b=1/);
});

test('clearClientCache forces the next call for a previously-cached URL to hit the loader again', async () => {
  setLocation('/elsewhere');
  let calls = 0;
  const wrapped = cachedClientLoader(async () => {
    calls += 1;
    return { calls };
  });

  await wrapped({ request: new Request('https://example.com/target') });
  clearClientCache();
  await wrapped({ request: new Request('https://example.com/target') });
  assert.equal(calls, 2);
});

/** A data router whose one child route hangs on a never-resolving loader,
 * so `router.state.navigation.state` stays `'loading'` for the test to
 * inspect — react-router flips `state.navigation` synchronously as soon as
 * `.navigate()` is called, before the loader promise ever settles. */
function createHangingRouter() {
  const routes = [
    {
      path: '/',
      element: h(RouteOutlet, { fallback: h('span', null, 'skeleton') }),
      children: [
        { index: true, element: h('span', null, 'home') },
        {
          path: 'other',
          loader: () => new Promise(() => {}),
          element: h('span', null, 'other'),
        },
      ],
    },
  ];
  return createMemoryRouter(routes, { initialEntries: ['/'] });
}

test('RouteOutlet renders the outlet content while idle', () => {
  const router = createHangingRouter();
  const markup = renderToStaticMarkup(h(RouterProvider, { router }));
  assert.match(markup, /home/);
  assert.doesNotMatch(markup, /skeleton/);
});

test('RouteOutlet renders the fallback during a genuine cross-route pending navigation', () => {
  const router = createHangingRouter();
  router.navigate('/other');
  assert.equal(router.state.navigation.state, 'loading');

  const markup = renderToStaticMarkup(h(RouterProvider, { router }));
  assert.match(markup, /skeleton/);
  assert.doesNotMatch(markup, /other/, 'the target route must not render until its loader resolves');
});
