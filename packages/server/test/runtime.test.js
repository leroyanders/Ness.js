import assert from 'node:assert/strict';
import test from 'node:test';

import { getCache } from '@nessframework/cache';

import { handlerOptions, serverConfig } from '../src/runtime.js';
import { applyRuntimeConfig } from '../src/runtime.js';

/**
 * The config used to be read only by `ness start`, so a Worker or a Lambda ran
 * with no cache adapter, no instrumentation and none of the configured headers
 * — silently. These pin the shape every target now shares.
 */

test('a defineNessConfig result is read from its ness key', () => {
  const { server, instrumentation } = serverConfig({
    ness: {
      server: { trustProxy: true },
      instrumentation: { onError() {} },
    },
    vite: { plugins: [] },
  });

  assert.deepEqual(server, { trustProxy: true });
  assert.equal(typeof instrumentation.onError, 'function');
});

test('a module namespace is unwrapped through its default export', () => {
  const { server } = serverConfig({
    default: { ness: { server: { trustProxy: true } } },
  });
  assert.deepEqual(server, { trustProxy: true });
});

test('a plain server object is taken as it is', () => {
  assert.deepEqual(
    serverConfig({ redirects: [{ from: '/a', to: '/b' }] }).server,
    {
      redirects: [{ from: '/a', to: '/b' }],
    },
  );
  assert.deepEqual(serverConfig(undefined).server, {});
});

test('process options are kept out of the handler options', () => {
  const options = handlerOptions({
    cache: { adapter: 'memory' },
    compression: false,
    configureServer() {},
    images: false,
    shutdownTimeout: 5000,
    trustProxy: true,
    redirects: [{ from: '/a', to: '/b' }],
    headers: [{ source: '/(.*)', headers: [] }],
  });

  assert.deepEqual(Object.keys(options).sort(), ['headers', 'redirects']);
});

test('the configured instrumentation is registered', async () => {
  const seen = [];
  await applyRuntimeConfig({
    ness: {
      server: {},
      instrumentation: {
        onError(payload) {
          seen.push(payload);
        },
      },
    },
  });

  const { emit } = await import('@nessframework/instrumentation');
  await emit('onError', { error: new Error('reported') });

  assert.ok(
    seen.some(payload => payload.error?.message === 'reported'),
    'the config named an instrumentation hook and it was never registered',
  );
});

test('the configured cache adapter becomes the active one', async () => {
  await applyRuntimeConfig({
    ness: { server: { cache: { adapter: 'memory' } } },
  });

  const cache = getCache();
  assert.equal((cache.adapter ?? cache).constructor.name, 'MemoryCacheAdapter');

  await cache.write('runtime:key', 'value', { life: 'minutes' });
  assert.equal((await cache.read('runtime:key')).entry.value, 'value');
});

test('a config with no cache leaves the active one alone', async () => {
  const before = getCache();
  await applyRuntimeConfig({ ness: { server: {} } });
  assert.equal(getCache(), before);
});

test('the server section comes back alongside the handler options', async () => {
  const { server, options } = await applyRuntimeConfig({
    ness: {
      server: { trustProxy: true, shutdownTimeout: 42, rewrites: [] },
    },
  });

  assert.equal(server.trustProxy, true);
  assert.equal(server.shutdownTimeout, 42);
  assert.deepEqual(options, { rewrites: [] });
});
