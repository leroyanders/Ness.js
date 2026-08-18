import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { nessVitePlugin } from '../dist/vite/index.js';

/**
 * A project as `ness dev` lays it out: the real app, plus the generated React
 * Router root under `.ness/config` whose `app/` holds only types.
 */
function scaffold() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-vite-root-'));
  fs.mkdirSync(path.join(root, 'app', 'routes'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'app', 'routes', 'page.tsx'),
    'export default function P() { return null; }\n',
  );
  fs.mkdirSync(path.join(root, '.ness', 'config', 'app', '+types'), {
    recursive: true,
  });
  return root;
}

/** Enough of a Vite dev server for `configureServer` to run against. */
function fakeServer(root) {
  const errors = [];
  return {
    errors,
    config: { root, logger: { error: message => errors.push(message) } },
    watcher: { on() {} },
    restart: async () => {},
  };
}

test('the generated .ness/config root finds the real app, not one that never existed', async () => {
  const root = scaffold();
  const server = fakeServer(path.join(root, '.ness', 'config'));
  nessVitePlugin({ configFile: 'ness.config.mjs' }).configureServer(server);
  await new Promise(resolve => setTimeout(resolve, 50));

  assert.deepEqual(server.errors, [], 'no error is logged');
  assert.ok(
    fs.existsSync(path.join(root, 'app', '.ness', 'routes', 'root__page.tsx')),
    'the real route tree is the one that got generated',
  );
  fs.rmSync(root, { recursive: true, force: true });
});

test('a Vite server with no route tree above it is left alone', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-vite-empty-'));
  const server = fakeServer(root);
  nessVitePlugin({ configFile: 'ness.config.mjs' }).configureServer(server);
  await new Promise(resolve => setTimeout(resolve, 50));

  assert.deepEqual(
    server.errors,
    [],
    'not having routes is not an error to report',
  );
  fs.rmSync(root, { recursive: true, force: true });
});
