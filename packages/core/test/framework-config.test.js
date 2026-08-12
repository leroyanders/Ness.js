import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defineConfig,
  defineNessConfig,
  resolveNessRouterConfig,
} from '../src/framework/config.js';

test('framework config enables SSR defaults and removes unsupported hooks in RSC mode', () => {
  const standard = defineConfig({ rsc: false, prerender: ['/'] });
  assert.equal(standard.ssr, true);
  assert.deepEqual(standard.prerender, ['/']);
  assert.equal(typeof standard.buildEnd, 'function');

  // RSC Framework Mode is the default and rejects `buildEnd` outright, so
  // that hook is still stripped. `prerender` needs no special-casing at all —
  // React Router's RSC prerender plugin honors it exactly like classic mode.
  const rsc = defineConfig({ prerender: ['/'] });
  assert.equal(rsc.buildEnd, undefined);
  assert.deepEqual(rsc.prerender, ['/']);
});

test('unified config separates Vite, router, server, and instrumentation options', () => {
  const register = () => {};
  const unified = defineNessConfig({
    vite: { base: '/assets/' },
    router: { prerender: ['/'] },
    server: { images: false },
    instrumentation: { register },
  });
  assert.equal(unified.base, '/assets/');
  assert.equal(unified.ness.server.images, false);
  assert.equal(unified.ness.instrumentation.register, register);

  const router = resolveNessRouterConfig(unified, '/project');
  assert.equal(router.appDirectory, '/project/app');
  assert.equal(router.buildDirectory, '/project/build');
  assert.deepEqual(router.prerender, ['/']);
});
