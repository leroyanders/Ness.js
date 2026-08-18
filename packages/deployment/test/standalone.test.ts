import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createStandaloneOutput } from '../dist/standalone.js';

/** A project just complete enough for the bundler to accept it. */
function scaffold(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-standalone-'));
  for (const [name, contents] of Object.entries(files)) {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  return root;
}

const MINIMAL = {
  'package.json': JSON.stringify({ name: 'app', version: '1.0.0' }),
  'build/server/index.js': 'export default {};\n',
};

/**
 * Splitting the runtime half of the config into `ness.server.config.*` is the
 * documented way to keep Vite out of a file the production server imports —
 * and the Vercel bundler already honours it. A bundle that copied
 * `ness.config.*` and not the file it imports booted straight into
 * ERR_MODULE_NOT_FOUND, which is only visible by starting the bundle.
 */
test('the bundle carries every config the server will look for at boot', async t => {
  const root = scaffold({
    ...MINIMAL,
    'ness.config.ts': "export { server } from './ness.server.config.ts';\n",
    'ness.server.config.ts': 'export const server = {};\n',
    'instrumentation.mjs': 'export default {};\n',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const report = await createStandaloneOutput({ root, logger: null });

  for (const file of [
    'ness.config.ts',
    'ness.server.config.ts',
    'instrumentation.mjs',
  ]) {
    assert.ok(
      fs.existsSync(path.join(report.output, file)),
      `${file} must be copied into the bundle`,
    );
  }
});

test('the same holds for the JavaScript spellings of those configs', async t => {
  const root = scaffold({
    ...MINIMAL,
    'ness.config.mjs': "export { server } from './ness.server.config.mjs';\n",
    'ness.server.config.mjs': 'export const server = {};\n',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const report = await createStandaloneOutput({ root, logger: null });

  assert.ok(fs.existsSync(path.join(report.output, 'ness.config.mjs')));
  assert.ok(fs.existsSync(path.join(report.output, 'ness.server.config.mjs')));
});

test('a launcher and a manifest make the bundle runnable on its own', async t => {
  const root = scaffold(MINIMAL);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const report = await createStandaloneOutput({ root, logger: null });

  assert.ok(fs.existsSync(path.join(report.output, 'server.mjs')));
  const manifest = JSON.parse(
    fs.readFileSync(path.join(report.output, 'package.json'), 'utf8'),
  ) as { type: string; scripts: { start: string } };
  assert.equal(manifest.type, 'module', 'the launcher is ESM');
  assert.equal(manifest.scripts.start, 'node server.mjs');
});
