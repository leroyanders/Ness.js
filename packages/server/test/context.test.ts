import assert from 'node:assert/strict';
import test from 'node:test';

import { MemoryCacheAdapter, setCache } from '@nessframework/cache';

import {
  after,
  assertUntainted,
  connection,
  createNessRequestHandler,
  noStore,
  taintObjectReference,
  taintUniqueValue,
} from '../dist/index.js';

function isolate() {
  setCache(new MemoryCacheAdapter());
}

async function settled(ms = 30) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

test('after() runs once the response body has been sent', async () => {
  isolate();
  const order = [];
  const handler = createNessRequestHandler({
    requestHandler: async () => {
      after(() => order.push('after'));
      return new Response('body', {
        headers: { 'content-type': 'text/plain' },
      });
    },
  });
  const response = await handler(new Request('https://example.com/'));
  order.push('returned');
  assert.equal(await response.text(), 'body');
  await settled();
  assert.deepEqual(order, ['returned', 'after']);
});

test('after() outside a request still runs, later', async () => {
  const ran = [];
  after(() => ran.push(true));
  assert.equal(ran.length, 0);
  await settled();
  assert.equal(ran.length, 1);
});

test('noStore() keeps the response out of the page cache', async () => {
  isolate();
  let renders = 0;
  const handler = createNessRequestHandler({
    requestHandler: async () => {
      renders += 1;
      noStore();
      return new Response('<html>dynamic</html>', {
        headers: { 'content-type': 'text/html' },
      });
    },
  });
  await (await handler(new Request('https://example.com/'))).text();
  await settled();
  const second = await handler(new Request('https://example.com/'));
  await second.text();
  assert.equal(renders, 2);
  assert.notEqual(second.headers.get('x-ness-cache'), 'HIT');
});

test('connection() marks the request dynamic the same way', async () => {
  isolate();
  let renders = 0;
  const handler = createNessRequestHandler({
    requestHandler: async () => {
      renders += 1;
      await connection();
      return new Response('<html>per-request</html>', {
        headers: { 'content-type': 'text/html' },
      });
    },
  });
  await (await handler(new Request('https://example.com/'))).text();
  await settled();
  await (await handler(new Request('https://example.com/'))).text();
  assert.equal(renders, 2);
});

test('a tainted object is caught crossing the boundary', () => {
  const secret = { apiKey: 'k-123456789' };
  taintObjectReference('Do not pass the config to the client.', secret);
  assert.throws(
    () => assertUntainted({ page: 1, nested: [{ deep: secret }] }),
    /Do not pass the config/,
  );
  assert.deepEqual(assertUntainted({ page: 1 }), { page: 1 });
});

test('a tainted unique value is caught inside strings', () => {
  const lifetime = {};
  taintUniqueValue('Never send the session token.', lifetime, 'tok_abcdef123');
  assert.throws(
    () => assertUntainted({ token: 'tok_abcdef123' }),
    /Never send the session token/,
  );
  assert.doesNotThrow(() => assertUntainted({ token: 'other' }));
});

test('maxDuration fails the request with a 504', async () => {
  isolate();
  const handler = createNessRequestHandler({
    requestHandler: () =>
      new Promise(resolve =>
        setTimeout(
          () => resolve(new Response('late')),
          150,
        ),
      ),
    pages: [{ path: '/slow', config: { maxDuration: 0.05 } }],
  });
  const response = await handler(new Request('https://example.com/slow'));
  assert.equal(response.status, 504);
});

test('dynamicParams: false answers 404 for a path the build did not prerender', async () => {
  isolate();
  const handler = createNessRequestHandler({
    requestHandler: async () => new Response('rendered'),
    pages: [{ path: '/blog/:slug', config: { dynamicParams: false } }],
    prerenderedPaths: ['/blog/hello'],
  });
  const known = await handler(new Request('https://example.com/blog/hello'));
  assert.equal(known.status, 200);
  const unknown = await handler(new Request('https://example.com/blog/nope'));
  assert.equal(unknown.status, 404);
});
