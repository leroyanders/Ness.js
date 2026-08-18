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
