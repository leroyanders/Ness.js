import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MemoryCacheAdapter,
  revalidateTag,
  setCache,
} from '@nessframework/cache';

import { createNessRequestHandler } from '../dist/index.js';

function isolate() {
  setCache(new MemoryCacheAdapter());
}

async function settled(ms = 30) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * A fetch the tests control completely: counts calls, answers from a table.
 *
 * Installed exactly once, before the first handler wraps the global — the
 * wrapper captures whatever `fetch` it replaced, so a stub assigned later
 * would clobber the wrapper instead of sitting underneath it. Each test
 * swaps the table, not the function.
 */
const network = { routes: {}, calls: [] };
globalThis.fetch = async input => {
  const url = input instanceof Request ? input.url : String(input);
  network.calls.push(url);
  return new Response(network.routes[url] ?? 'not found', {
    status: network.routes[url] ? 200 : 404,
    headers: { 'content-type': 'text/plain' },
  });
};

function stubNetwork(routes) {
  network.routes = routes;
  network.calls = [];
  return network.calls;
}

test('identical GETs inside one request share one network call', async () => {
  isolate();
  const calls = stubNetwork({ 'https://api.example.com/data': 'payload' });
  const handler = createNessRequestHandler({
    requestHandler: async () => {
      const [a, b] = await Promise.all([
        fetch('https://api.example.com/data'),
        fetch('https://api.example.com/data'),
      ]);
      const third = await fetch('https://api.example.com/data');
      return Response.json({
        a: await a.text(),
        b: await b.text(),
        c: await third.text(),
      });
    },
  });
  const response = await handler(new Request('https://example.com/'));
  const body = await response.json();
  assert.deepEqual(body, { a: 'payload', b: 'payload', c: 'payload' });
  assert.equal(calls.length, 1);
});

test('the memo does not leak across requests', async () => {
  isolate();
  const calls = stubNetwork({ 'https://api.example.com/data': 'payload' });
  const handler = createNessRequestHandler({
    requestHandler: async () => {
      await (await fetch('https://api.example.com/data')).text();
      return new Response('ok');
    },
    // Keep the page cache out of the way: every request must render.
    cachePolicy: () => undefined,
  });
  await (await handler(new Request('https://example.com/'))).text();
  await (await handler(new Request('https://example.com/'))).text();
  assert.equal(calls.length, 2);
});

test('next.revalidate stores the response in the shared data cache', async () => {
  isolate();
  const calls = stubNetwork({ 'https://api.example.com/posts': '[1,2]' });
  const handler = createNessRequestHandler({
    requestHandler: async () => {
      const posts = await fetch('https://api.example.com/posts', {
        next: { revalidate: 60, tags: ['posts'] },
      });
      return new Response(await posts.text());
    },
    cachePolicy: () => undefined,
  });
  assert.equal(
    await (await handler(new Request('https://example.com/'))).text(),
    '[1,2]',
  );
  await settled();
  assert.equal(
    await (await handler(new Request('https://example.com/'))).text(),
    '[1,2]',
  );
  // Second request hit the data cache, not the network.
  assert.equal(calls.length, 1);

  await revalidateTag('posts');
  await (await handler(new Request('https://example.com/'))).text();
  await settled();
  assert.equal(calls.length, 2);
});

test('POST requests are never memoized', async () => {
  isolate();
  const calls = stubNetwork({ 'https://api.example.com/data': 'ok' });
  const handler = createNessRequestHandler({
    requestHandler: async () => {
      await fetch('https://api.example.com/data', { method: 'POST' });
      await fetch('https://api.example.com/data', { method: 'POST' });
      return new Response('done');
    },
  });
  await (await handler(new Request('https://example.com/'))).text();
  assert.equal(calls.length, 2);
});
