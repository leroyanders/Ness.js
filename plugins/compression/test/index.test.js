import assert from 'node:assert/strict';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import test from 'node:test';
import compression, { compressAsset } from '../src/index.js';

test('compression creates smaller gzip and Brotli assets', () => {
  const source = 'const ness = true;\n'.repeat(500);
  const assets = compressAsset('entry.js', source, { threshold: 0 });

  assert.deepEqual(
    assets.map(asset => asset.filename),
    ['entry.js.gz', 'entry.js.br'],
  );
  assert.equal(gunzipSync(assets[0].source).toString(), source);
  assert.equal(brotliDecompressSync(assets[1].source).toString(), source);
});

test('compression emits assets through the Vite plugin contract', () => {
  const emitted = [];
  compression({ threshold: 0 }).generateBundle.call(
    { emitFile: asset => emitted.push(asset) },
    {},
    {
      'entry.js': {
        type: 'chunk',
        code: 'export const framework = "ness";'.repeat(100),
      },
    },
  );
  assert.equal(emitted.length, 2);
});
