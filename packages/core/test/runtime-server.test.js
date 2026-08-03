import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyHeaders,
  applyRoutingRules,
  composeMiddleware,
  createNessRequestHandler,
  matchPattern,
} from '../src/runtime/server.js';

test('routing rules support dynamic redirects and rewrites', () => {
  const request = new Request('https://ness.dev/old/guide');
  const redirected = applyRoutingRules(request, {
    redirects: [
      { source: '/old/:slug', destination: '/docs/:slug', permanent: true },
    ],
  });
  assert.equal(redirected.response.status, 308);
  assert.equal(
    redirected.response.headers.get('location'),
    'https://ness.dev/docs/guide',
  );

  const rewritten = applyRoutingRules(new Request('https://ness.dev/blog/1'), {
    rewrites: [{ source: '/blog/:id', destination: '/posts/:id' }],
  });
  assert.equal(new URL(rewritten.request.url).pathname, '/posts/1');
  assert.deepEqual(matchPattern('/blog/:id', '/blog/42'), { id: '42' });
});

test('nested middleware runs down and back up the response chain', async () => {
  const calls = [];
  const execute = composeMiddleware(
    [
      async (_context, next) => {
        calls.push('a:start');
        const response = await next();
        calls.push('a:end');
        return response;
      },
      async (_context, next) => {
        calls.push('b:start');
        const response = await next();
        calls.push('b:end');
        return response;
      },
    ],
    async () => new Response('ok'),
  );
  assert.equal(
    await (await execute({ request: new Request('https://ness.dev') })).text(),
    'ok',
  );
  assert.deepEqual(calls, ['a:start', 'b:start', 'b:end', 'a:end']);
});

test('response header rules are applied by route pattern', () => {
  const response = applyHeaders(
    new Response('ok'),
    new Request('https://ness.dev/docs/a'),
    [{ source: '/docs/:slug', headers: [{ key: 'x-docs', value: 'true' }] }],
  );
  assert.equal(response.headers.get('x-docs'), 'true');
});

test('React Router owns its load context unless the application provides one', async () => {
  let receivedContext = 'not-called';
  const handler = createNessRequestHandler({
    requestHandler(_request, context) {
      receivedContext = context;
      return new Response('ok');
    },
    cachePolicy: () => undefined,
  });

  assert.equal(
    await (await handler(new Request('https://ness.dev/'))).text(),
    'ok',
  );
  assert.equal(receivedContext, undefined);
});
