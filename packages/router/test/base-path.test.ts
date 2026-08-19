import assert from 'node:assert/strict';
import test from 'node:test';
import { buildManifestPayload, defineConfig } from '../dist/index.js';

test('basePath becomes the router basename', () => {
  const config = defineConfig({ basePath: '/docs' });
  assert.equal(config.basename, '/docs');
});

test('an explicit basename outranks basePath', () => {
  const config = defineConfig({ basePath: '/docs', basename: '/other' });
  assert.equal(config.basename, '/other');
});

test('every route is compiled into the initial client manifest by default', () => {
  const config = defineConfig();
  assert.deepEqual(config.routeDiscovery, { mode: 'initial' });
});

test('an application can still opt back into lazy route discovery', () => {
  const config = defineConfig({ routeDiscovery: { mode: 'lazy' } });
  assert.deepEqual(config.routeDiscovery, { mode: 'lazy' });
});

test('the manifest records basePath, assetPrefix and prerendered paths', () => {
  const manifest = buildManifestPayload({
    basePath: '/docs',
    assetPrefix: 'https://cdn.example.com',
    prerenderedPaths: ['/blog/hello'],
  });
  assert.equal(manifest.basePath, '/docs');
  assert.equal(manifest.assetPrefix, 'https://cdn.example.com');
  assert.deepEqual(manifest.prerenderedPaths, ['/blog/hello']);
});
