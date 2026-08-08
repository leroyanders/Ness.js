import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
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

/**
 * Two properties, both found by comparing the twins against what the server
 * actually served.
 *
 * The twin must match the shipped file byte for byte: Vite post-processes
 * chunks between `generateBundle` and the write, so compressing the in-memory
 * bundle produced a `.br` that decoded to something else.
 *
 * And the bundle is not the whole build. Files copied from `public/`,
 * prerendered HTML and late manifests are written to the output directory
 * without ever being bundle entries.
 */
async function run(plugin, directory) {
  plugin.writeBundle({ dir: directory });
  await plugin.closeBundle();
}

async function fixture(files) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ness-compress-'));
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(directory, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, contents);
  }
  return directory;
}

test('compression compresses what was written, not the in-memory bundle', async () => {
  const shipped = 'export const framework = "ness";'.repeat(100);
  const directory = await fixture({ 'entry.js': shipped });

  await run(compression({ threshold: 0 }), directory);

  const brotli = await fs.readFile(path.join(directory, 'entry.js.br'));
  const gzip = await fs.readFile(path.join(directory, 'entry.js.gz'));
  assert.equal(brotliDecompressSync(brotli).toString(), shipped);
  assert.equal(gunzipSync(gzip).toString(), shipped);

  await fs.rm(directory, { recursive: true, force: true });
});

test('compression covers files that were never bundle entries', async () => {
  const html =
    '<!doctype html><html><body>' + 'x'.repeat(2000) + '</body></html>';
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg">' +
    '<rect/>'.repeat(300) +
    '</svg>';
  const directory = await fixture({
    'index.html': html,
    'assets/logo.svg': svg,
    'assets/manifest-abc.js': 'window.__manifest = {};'.repeat(100),
  });

  await run(compression({ threshold: 0 }), directory);

  assert.equal(
    brotliDecompressSync(
      await fs.readFile(path.join(directory, 'index.html.br')),
    ).toString(),
    html,
    'prerendered HTML shipped uncompressed',
  );
  assert.equal(
    brotliDecompressSync(
      await fs.readFile(path.join(directory, 'assets/logo.svg.br')),
    ).toString(),
    svg,
    'a file copied from public/ shipped uncompressed',
  );
  await fs.access(path.join(directory, 'assets/manifest-abc.js.br'));

  await fs.rm(directory, { recursive: true, force: true });
});

test('compression does not compress its own output on a rebuild', async () => {
  const directory = await fixture({ 'entry.js': 'x'.repeat(4000) });

  await run(compression({ threshold: 0 }), directory);
  await run(compression({ threshold: 0 }), directory);

  const files = await fs.readdir(directory);
  assert.deepEqual(
    files.sort(),
    ['entry.js', 'entry.js.br', 'entry.js.gz'],
    'a second build compressed the twins from the first',
  );

  await fs.rm(directory, { recursive: true, force: true });
});

test('compression leaves an incompressible file alone', async () => {
  const directory = await fixture({ 'photo.png': 'x'.repeat(4000) });
  await run(compression({ threshold: 0 }), directory);
  assert.deepEqual(await fs.readdir(directory), ['photo.png']);
  await fs.rm(directory, { recursive: true, force: true });
});

test('compression does nothing when the output directory is absent', async () => {
  const plugin = compression();
  plugin.writeBundle({ dir: '/nonexistent-ness-output' });
  await plugin.closeBundle();
});

test('compression does nothing when no build wrote anything', async () => {
  await compression().closeBundle();
});
