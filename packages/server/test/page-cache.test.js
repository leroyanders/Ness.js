import assert from 'node:assert/strict';
import test from 'node:test';

import { MemoryCacheAdapter, setCache } from '@nessframework/cache';

import {
  createNessRequestHandler,
  defaultCacheableRequest,
  defaultCachePolicy,
  storableResponse,
} from '../src/index.js';

/**
 * The page cache is written without blocking the response, so a test that
 * fires two requests back to back races the write and sees two misses. Every
 * visit settles the write before returning.
 */
async function visit(handler, url = 'https://example.com/', init) {
  const response = await handler(new Request(url, init));
  const body = await response.text();
  await new Promise(resolve => setTimeout(resolve, 20));
  return {
    body,
    headers: response.headers,
    state: response.headers.get('x-ness-cache'),
  };
}

/** A fresh store per test, or one test's entries answer the next one's reads. */
function isolate() {
  setCache(new MemoryCacheAdapter());
}

test('an anonymous HTML response is cached and replayed', async () => {
  isolate();
  let renders = 0;
  const handler = createNessRequestHandler({
    requestHandler: async () => {
      renders += 1;
      return new Response('<html>page</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    },
  });

  assert.equal((await visit(handler)).state, 'MISS');
  assert.equal((await visit(handler)).state, 'HIT');
  assert.equal(renders, 1, 'the second visit should not have re-rendered');
});

test('a response that sets a cookie is never stored', async () => {
  isolate();
  let issued = 0;
  const handler = createNessRequestHandler({
    requestHandler: async () =>
      new Response('<html>welcome</html>', {
        status: 200,
        headers: {
          'content-type': 'text/html',
          'set-cookie': `sid=session-${++issued}; Path=/; HttpOnly`,
        },
      }),
  });

  const first = await visit(handler);
  const second = await visit(handler);

  assert.notEqual(
    first.headers.get('set-cookie'),
    second.headers.get('set-cookie'),
    'two anonymous visitors were handed the same session cookie',
  );
  assert.equal(issued, 2, 'the second visit was answered from the cache');
});

test('a custom cachePolicy cannot reintroduce the cookie leak', async () => {
  isolate();
  let issued = 0;
  const handler = createNessRequestHandler({
    // Says yes to everything, the way a project tuning its own caching might.
    cachePolicy: () => ({ life: 'default', path: '/', tags: ['pages'] }),
    requestHandler: async () =>
      new Response('<html>welcome</html>', {
        status: 200,
        headers: {
          'content-type': 'text/html',
          'set-cookie': `sid=session-${++issued}`,
        },
      }),
  });

  const first = await visit(handler);
  const second = await visit(handler);

  assert.notEqual(
    first.headers.get('set-cookie'),
    second.headers.get('set-cookie'),
  );
});

test('a credentialed request is not served a stored page', async () => {
  isolate();
  const handler = createNessRequestHandler({
    requestHandler: async request =>
      new Response(
        `<html>${request.headers.has('cookie') ? 'signed in' : 'anonymous'}</html>`,
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
  });

  await visit(handler);
  assert.equal((await visit(handler)).state, 'HIT');

  const signedIn = await visit(handler, 'https://example.com/', {
    headers: { cookie: 'sid=abc' },
  });
  assert.match(signedIn.body, /signed in/);
  assert.equal(
    signedIn.state,
    null,
    'the cache was consulted for a request carrying credentials',
  );
});

test('a credentialed request does not fill the cache for everyone else', async () => {
  isolate();
  const handler = createNessRequestHandler({
    requestHandler: async request =>
      new Response(
        `<html>${request.headers.get('cookie') ?? 'anonymous'}</html>`,
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
  });

  await visit(handler, 'https://example.com/', {
    headers: { cookie: 'sid=private' },
  });
  const anonymous = await visit(handler);

  assert.match(anonymous.body, /anonymous/);
  assert.equal(anonymous.state, 'MISS');
});

test('defaultCacheableRequest refuses credentials and non-GET', () => {
  const url = 'https://example.com/';
  assert.equal(defaultCacheableRequest(new Request(url)), true);
  assert.equal(
    defaultCacheableRequest(new Request(url, { method: 'POST' })),
    false,
  );
  assert.equal(
    defaultCacheableRequest(new Request(url, { headers: { cookie: 'a=b' } })),
    false,
  );
  assert.equal(
    defaultCacheableRequest(
      new Request(url, { headers: { authorization: 'Bearer x' } }),
    ),
    false,
  );
});

test('storableResponse refuses anything carrying set-cookie', () => {
  assert.equal(storableResponse(new Response('a')), true);
  assert.equal(
    storableResponse(new Response('a', { headers: { 'set-cookie': 'a=b' } })),
    false,
  );
});

test('defaultCachePolicy keeps its existing refusals', () => {
  const request = new Request('https://example.com/');
  const html = { 'content-type': 'text/html' };

  assert.ok(defaultCachePolicy(request, new Response('a', { headers: html })));
  assert.equal(
    defaultCachePolicy(
      request,
      new Response('a', { status: 500, headers: html }),
    ),
    undefined,
  );
  assert.equal(
    defaultCachePolicy(
      request,
      new Response('a', { headers: { 'content-type': 'application/json' } }),
    ),
    undefined,
  );
  assert.equal(
    defaultCachePolicy(
      request,
      new Response('a', { headers: { ...html, 'set-cookie': 'sid=1' } }),
    ),
    undefined,
  );
});
