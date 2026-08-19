import assert from 'node:assert/strict';
import test from 'node:test';

import { MemoryCacheAdapter, setCache } from '@nessframework/cache';

import { createNessRequestHandler, pagePathname } from '../dist/index.js';

/**
 * Same rhythm as page-cache.test.ts: the cache write does not block the
 * response, so every visit settles it before the next read.
 */
async function visit(handler, url, init) {
  const response = await handler(new Request(url, init));
  const body = await response.text();
  await new Promise(resolve => setTimeout(resolve, 20));
  return {
    body,
    status: response.status,
    state: response.headers.get('x-ness-cache'),
  };
}

function isolate() {
  setCache(new MemoryCacheAdapter());
}

/** A handler whose loaders are the render — counting runs counts loaders. */
function dataHandler(pages, onRender) {
  return createNessRequestHandler({
    requestHandler: async request => {
      onRender(request);
      return new Response('data-payload', {
        status: 200,
        headers: { 'content-type': 'text/x-script' },
      });
    },
    pages,
  });
}

test('pagePathname strips the single-fetch spellings back to the page', () => {
  assert.equal(pagePathname('/dashboard.data'), '/dashboard');
  assert.equal(pagePathname('/dashboard.rsc'), '/dashboard');
  assert.equal(pagePathname('/_.data'), '/');
  assert.equal(pagePathname('/docs/_.rsc'), '/docs/');
  assert.equal(pagePathname('/plain'), '/plain');
});

test('a navigation data request for a page with revalidate is cached', async () => {
  isolate();
  let renders = 0;
  const handler = dataHandler(
    [{ path: '/dash', config: { revalidate: 60 } }],
    () => renders++,
  );

  assert.equal(
    (await visit(handler, 'https://example.com/dash.data')).state,
    'MISS',
  );
  assert.equal(
    (await visit(handler, 'https://example.com/dash.data')).state,
    'HIT',
  );
  assert.equal(renders, 1, 'the second navigation must not run the loaders');
});

test('.rsc navigations are cached the same way', async () => {
  isolate();
  let renders = 0;
  const handler = dataHandler(
    [{ path: '/dash', config: { revalidate: 60 } }],
    () => renders++,
  );

  await visit(handler, 'https://example.com/dash.rsc');
  const second = await visit(handler, 'https://example.com/dash.rsc');
  assert.equal(second.state, 'HIT');
  assert.equal(renders, 1);
});

test('a page that declared nothing keeps running its loaders per navigation', async () => {
  isolate();
  let renders = 0;
  const handler = dataHandler([{ path: '/dash' }], () => renders++);

  await visit(handler, 'https://example.com/dash.data');
  await visit(handler, 'https://example.com/dash.data');
  assert.equal(renders, 2, 'no revalidate means no ISR bargain for data');
});

test('force-dynamic keeps data requests out of the cache entirely', async () => {
  isolate();
  let renders = 0;
  const handler = dataHandler(
    [{ path: '/live', config: { dynamic: 'force-dynamic' } }],
    () => renders++,
  );

  await visit(handler, 'https://example.com/live.data');
  await visit(handler, 'https://example.com/live.data');
  assert.equal(renders, 2);
});

test('a credentialed data request bypasses the shared cache', async () => {
  isolate();
  let renders = 0;
  const handler = dataHandler(
    [{ path: '/dash', config: { revalidate: 60 } }],
    () => renders++,
  );

  const init = { headers: { cookie: 'sid=1' } };
  await visit(handler, 'https://example.com/dash.data', init);
  await visit(handler, 'https://example.com/dash.data', init);
  assert.equal(renders, 2);
});

test('dynamicParams: false closes data requests over unprerendered params too', async () => {
  isolate();
  const handler = createNessRequestHandler({
    requestHandler: async () =>
      new Response('data-payload', {
        status: 200,
        headers: { 'content-type': 'text/x-script' },
      }),
    pages: [{ path: '/posts/:id', config: { dynamicParams: false } }],
    prerenderedPaths: ['/posts/1'],
  });

  assert.equal(
    (await visit(handler, 'https://example.com/posts/1.data')).status,
    200,
  );
  assert.equal(
    (await visit(handler, 'https://example.com/posts/2.data')).status,
    404,
    'an unprerendered param must 404 on the data request as well',
  );
});
