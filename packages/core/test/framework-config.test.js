import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defineConfig,
  defineNessConfig,
  resolveNessRouterConfig,
} from '../src/framework/config.js';

test('framework config enables SSR defaults and removes unsupported hooks in RSC mode', () => {
  const standard = defineConfig({ prerender: ['/'] });
  assert.equal(standard.ssr, true);
  assert.deepEqual(standard.prerender, ['/']);
  assert.equal(typeof standard.buildEnd, 'function');

  const rsc = defineConfig({ rsc: true, prerender: ['/'] });
  assert.equal(rsc.buildEnd, undefined);
  assert.equal(rsc.prerender, undefined);
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
