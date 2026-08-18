import assert from 'node:assert/strict';
import test from 'node:test';

import { registerInstrumentation } from '@nessframework/instrumentation';

import { createNessRequestHandler } from '../dist/index.js';

/**
 * These drive the real `createRequestHandler` from react-router with a minimal
 * server build, so what is asserted is that react-router calls the hook — not
 * that a mock of its contract does.
 */
function build({ loader, ErrorBoundary, handleError }) {
  return {
    entry: {
      module: {
        ...(handleError ? { handleError } : {}),
        default(request, status, headers, context) {
          return new Response('<html>rendered</html>', {
            status,
            headers: {
              ...Object.fromEntries(headers),
              'content-type': 'text/html',
            },
          });
        },
      },
    },
    routes: {
      root: {
        id: 'root',
        path: '',
        module: {
          default: () => null,
          ...(loader ? { loader } : {}),
          ...(ErrorBoundary ? { ErrorBoundary } : {}),
        },
      },
    },
    assets: {
      entry: { module: '', imports: [] },
      routes: {
        root: {
          id: 'root',
          path: '',
          hasAction: false,
          hasLoader: Boolean(loader),
          hasErrorBoundary: Boolean(ErrorBoundary),
          module: '',
        },
      },
      url: '',
      version: '1',
    },
    future: {},
    basename: '/',
    publicPath: '/',
    assetsBuildDirectory: 'build/client',
    ssr: true,
    isSpaMode: false,
    routeDiscovery: { mode: 'initial' },
    prerender: [],
  };
}

/** Registers a collector and removes it when the test ends. */
function collect(t) {
  const seen = [];
  const remove = registerInstrumentation({
    onError(payload) {
      seen.push(payload);
    },
  });
  t.after(remove);
  return seen;
}

test('a loader that throws behind an error boundary is reported', async t => {
  const seen = collect(t);
  const handler = createNessRequestHandler({
    build: build({
      loader() {
        throw new Error('the database is on fire');
      },
      ErrorBoundary: () => null,
    }),
    mode: 'production',
  });

  await handler(new Request('https://example.com/'));

  const routeErrors = seen.filter(payload => payload.source === 'route');
  assert.equal(
    routeErrors.length,
    1,
    'the boundary swallowed the error and nothing was reported',
  );
  assert.equal(routeErrors[0].error.message, 'the database is on fire');
  assert.equal(routeErrors[0].request.url, 'https://example.com/');
});

test("an application's own handleError still runs", async t => {
  const seen = collect(t);
  const applicationSaw = [];

  const handler = createNessRequestHandler({
    build: build({
      loader() {
        throw new Error('boom');
      },
      ErrorBoundary: () => null,
      handleError(error) {
        applicationSaw.push(error);
      },
    }),
    mode: 'production',
  });

  await handler(new Request('https://example.com/'));

  assert.equal(applicationSaw.length, 1, 'the application hook was replaced');
  assert.equal(applicationSaw[0].message, 'boom');
  assert.equal(seen.filter(payload => payload.source === 'route').length, 1);
});

test('a request the client abandoned is not reported', async t => {
  const seen = collect(t);
  const controller = new AbortController();

  const handler = createNessRequestHandler({
    build: build({
      async loader() {
        controller.abort();
        throw new Error('client went away');
      },
      ErrorBoundary: () => null,
    }),
    mode: 'production',
  });

  await handler(
    new Request('https://example.com/', { signal: controller.signal }),
  ).catch(() => {});

  assert.equal(
    seen.filter(payload => payload.source === 'route').length,
    0,
    'an abandoned request was reported as an application error',
  );
});

test('a successful request reports nothing', async t => {
  const seen = collect(t);
  const handler = createNessRequestHandler({
    build: build({ loader: () => ({ ok: true }) }),
    mode: 'production',
  });

  await handler(new Request('https://example.com/'));

  assert.equal(seen.filter(payload => payload.source === 'route').length, 0);
});

test('a build with no entry module is left alone', () => {
  assert.doesNotThrow(() =>
    createNessRequestHandler({
      requestHandler: async () => new Response('ok'),
    }),
  );
});
