import assert from 'node:assert/strict';
import test from 'node:test';

import { MemoryCacheAdapter, setCache } from '@nessframework/cache';

import { createNessRequestHandler, matchZone } from '../dist/index.js';

setCache(new MemoryCacheAdapter());

/**
 * Installed before any handler wraps the global; each test swaps the table.
 * The proxy path goes through the same wrapped fetch as everything else.
 */
const network = { responses: {}, requests: [] };
globalThis.fetch = async input => {
  const request = input instanceof Request ? input : new Request(input);
  network.requests.push(request);
  const body = network.responses[new URL(request.url).href];
  return new Response(body ?? 'zone not found', {
    status: body ? 200 : 404,
    headers: { 'content-type': 'text/html' },
  });
};

test('matchZone prefers the longest base path', () => {
  const zones = [
    { basePath: '/blog', destination: 'https://blog.internal' },
    { basePath: '/blog/admin', destination: 'https://admin.internal' },
  ];
  assert.equal(matchZone(zones, '/blog/post').destination, 'https://blog.internal');
  assert.equal(
    matchZone(zones, '/blog/admin/users').destination,
    'https://admin.internal',
  );
  assert.equal(matchZone(zones, '/shop'), undefined);
});

test('a zone request is proxied to the zone origin', async () => {
  network.responses = {
    'https://blog.internal/blog/hello': '<html>from the blog zone</html>',
  };
  network.requests = [];
  const handler = createNessRequestHandler({
    requestHandler: async () => new Response('main app'),
    zones: [{ basePath: '/blog', destination: 'https://blog.internal' }],
    cachePolicy: () => undefined,
  });
  const response = await handler(
    new Request('https://www.example.com/blog/hello'),
  );
  assert.equal(await response.text(), '<html>from the blog zone</html>');
  const proxied = network.requests.at(-1);
  assert.equal(new URL(proxied.url).origin, 'https://blog.internal');
  assert.equal(new URL(proxied.url).pathname, '/blog/hello');
  assert.equal(proxied.headers.get('x-forwarded-host'), '');
});

test('a request outside every zone renders locally', async () => {
  network.requests = [];
  const handler = createNessRequestHandler({
    requestHandler: async () => new Response('main app'),
    zones: [{ basePath: '/blog', destination: 'https://blog.internal' }],
    cachePolicy: () => undefined,
  });
  const response = await handler(new Request('https://www.example.com/'));
  assert.equal(await response.text(), 'main app');
  assert.equal(network.requests.length, 0);
});

test('a rewrite to another origin is proxied too', async () => {
  network.responses = {
    'https://legacy.internal/old-page': 'legacy content',
  };
  network.requests = [];
  const handler = createNessRequestHandler({
    requestHandler: async () => new Response('main app'),
    rewrites: [
      {
        source: '/old-page',
        destination: 'https://legacy.internal/old-page',
      },
    ],
    cachePolicy: () => undefined,
  });
  const response = await handler(
    new Request('https://www.example.com/old-page'),
  );
  assert.equal(await response.text(), 'legacy content');
  assert.equal(network.requests.length, 1);
});
