import assert from 'node:assert/strict';
import test from 'node:test';

import { createWorkerHandler, workerEntry } from '../dist/cloudflare.js';

/**
 * The Worker used to be built with `createWorkerHandler({ build })` and nothing
 * else, so a project's cache adapter, instrumentation, headers and redirects
 * were simply absent at the edge — with nothing to say they had been skipped.
 */
function build() {
  return {
    entry: {
      module: {
        default: (request, status, headers) =>
          new Response('<html>edge</html>', {
            status,
            headers: {
              ...Object.fromEntries(headers),
              'content-type': 'text/html',
            },
          }),
      },
    },
    routes: {
      root: { id: 'root', path: '', module: { default: () => null } },
    },
    assets: {
      entry: { module: '', imports: [] },
      routes: {
        root: {
          id: 'root',
          path: '',
          hasAction: false,
          hasLoader: false,
          hasErrorBoundary: false,
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

test('configured redirects apply at the edge', async () => {
  const worker = createWorkerHandler({
    build: build(),
    config: {
      ness: {
        server: { redirects: [{ source: '/old', destination: '/new' }] },
      },
    },
  });

  const response = await worker.fetch(
    new Request('https://shop.example.com/old'),
    {},
    {},
  );

  // 307 is the default; `permanent: true` or an explicit `status` changes it.
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get('location')).pathname, '/new');
});

test('configured response headers apply at the edge', async () => {
  const worker = createWorkerHandler({
    build: build(),
    config: {
      ness: {
        server: {
          headers: [
            {
              source: '/:path*',
              headers: [{ key: 'x-frame-options', value: 'DENY' }],
            },
          ],
        },
      },
    },
  });

  const response = await worker.fetch(
    new Request('https://shop.example.com/'),
    {},
    {},
  );

  assert.equal(response.headers.get('x-frame-options'), 'DENY');
});

test('a worker with no config still serves', async () => {
  const worker = createWorkerHandler({ build: build() });
  const response = await worker.fetch(
    new Request('https://shop.example.com/'),
    {},
    {},
  );
  assert.equal(response.status, 200);
});

test('the generated entry imports the runtime config when there is one', () => {
  assert.doesNotMatch(workerEntry(), /import config/);
  const withConfig = workerEntry({
    configPath: '../../ness.server.config.mjs',
  });
  assert.match(
    withConfig,
    /import config from '\.\.\/\.\.\/ness\.server\.config\.mjs'/,
  );
  assert.match(withConfig, /createWorkerHandler\(\{ build, config \}\)/);
});
