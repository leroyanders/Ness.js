import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  createVercelHandler,
  createVercelOutput,
  vercelEntry,
} from '../src/vercel.js';

test('the generated entry imports the runtime config when there is one', () => {
  assert.doesNotMatch(vercelEntry(), /import config/);
  assert.match(vercelEntry(), /createVercelHandler\(\{ build, root \}\)/);

  const withConfig = vercelEntry({ configPath: './ness.server.config.mjs' });
  assert.match(
    withConfig,
    /import config from '\.\/ness\.server\.config\.mjs'/,
  );
  assert.match(
    withConfig,
    /createVercelHandler\(\{ build, root, config \}\)/,
  );
});

test('the handler rejects a missing build', () => {
  assert.throws(() => createVercelHandler({}), /server build/);
});

test('the handler returns a request function without needing a request yet', () => {
  // Composition (applyRuntimeConfig, configureServer, Express) is deferred to
  // the first request — constructing the handler must not require a live
  // build, config resolution, or database, only the build export itself.
  const handler = createVercelHandler({ build: { fake: true } });
  assert.equal(typeof handler, 'function');
});

/* createVercelOutput: filesystem fixture, same style as trace.test.js. */

function createPackage(root, location, manifest) {
  const directory = path.join(root, location);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify(manifest),
  );
  return directory;
}

function createFixtureApp(context, { withNest = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-vercel-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'fixture-app',
      dependencies: { ws: '^8.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    }),
  );
  createPackage(root, 'node_modules/ws', { name: 'ws', version: '8.0.0' });
  createPackage(root, 'node_modules/typescript', {
    name: 'typescript',
    version: '5.0.0',
  });

  fs.mkdirSync(path.join(root, 'build', 'server'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'build', 'server', 'index.js'),
    'export const entry = {};\n',
  );
  fs.mkdirSync(path.join(root, 'build', 'client'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'build', 'client', 'index.html'),
    '<!doctype html><title>fixture</title>',
  );
  if (withNest) {
    fs.mkdirSync(path.join(root, 'build', 'nest'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'build', 'nest', 'app.module.js'),
      "import { WebSocketServer } from 'ws';\nexport class AppModule {}\n",
    );
  }
  return root;
}

test('createVercelOutput fails clearly when there is no build', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-vercel-empty-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'empty' }),
  );

  await assert.rejects(createVercelOutput({ root, logger: null }), /ness build/);
});

test('createVercelOutput produces a Build Output API v3 tree', async t => {
  const root = createFixtureApp(t);
  const report = await createVercelOutput({ root, logger: null });

  const functionDirectory = path.join(
    root,
    '.vercel',
    'output',
    'functions',
    'index.func',
  );
  assert.equal(report.function, functionDirectory);

  const vcConfig = JSON.parse(
    fs.readFileSync(path.join(functionDirectory, '.vc-config.json'), 'utf8'),
  );
  assert.deepEqual(vcConfig, {
    runtime: 'nodejs22.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
  });

  assert.ok(
    fs.existsSync(path.join(functionDirectory, 'index.js')),
    'entry file is written',
  );
  assert.ok(
    fs.existsSync(
      path.join(functionDirectory, 'build', 'server', 'index.js'),
    ),
    'server build is copied',
  );
  assert.ok(
    fs.existsSync(path.join(functionDirectory, 'build', 'nest', 'app.module.js')),
    'nest build is copied when present',
  );

  // The tracer, not a hand-curated glob: a real dependency ships, a
  // devDependency it needs nothing to do with does not.
  assert.ok(
    fs.existsSync(path.join(functionDirectory, 'node_modules', 'ws', 'package.json')),
    'a declared dependency is traced and copied',
  );
  assert.ok(
    !fs.existsSync(path.join(functionDirectory, 'node_modules', 'typescript')),
    'a devDependency is never traced, regardless of what imports it at runtime',
  );
  assert.equal(report.packages, 1);
  assert.deepEqual(report.missing, []);

  assert.ok(
    fs.existsSync(
      path.join(root, '.vercel', 'output', 'static', 'index.html'),
    ),
    'the client build becomes static output',
  );

  const config = JSON.parse(
    fs.readFileSync(
      path.join(root, '.vercel', 'output', 'config.json'),
      'utf8',
    ),
  );
  assert.equal(config.version, 3);
  assert.deepEqual(config.routes, [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index' },
  ]);
});

test('createVercelOutput works without the Nest plugin at all', async t => {
  const root = createFixtureApp(t, { withNest: false });
  const report = await createVercelOutput({ root, logger: null });

  assert.ok(
    !fs.existsSync(path.join(report.function, 'build', 'nest')),
    'no nest directory is invented when the app never built one',
  );
  assert.ok(
    fs.existsSync(path.join(report.function, 'build', 'server', 'index.js')),
    'the server build is still copied',
  );
});

test('createVercelOutput bundles a runtime config when one is on disk', async t => {
  const root = createFixtureApp(t, { withNest: false });
  fs.writeFileSync(
    path.join(root, 'ness.server.config.mjs'),
    'export default { server: {} };\n',
  );

  const report = await createVercelOutput({ root, logger: null });

  assert.ok(
    fs.existsSync(path.join(report.function, 'ness.server.config.mjs')),
    'the runtime config file is copied alongside the entry',
  );
  const entry = fs.readFileSync(
    path.join(report.function, 'index.js'),
    'utf8',
  );
  assert.match(entry, /import config from '\.\/ness\.server\.config\.mjs'/);
});

test('createVercelOutput honours a custom runtime', async t => {
  const root = createFixtureApp(t, { withNest: false });
  const report = await createVercelOutput({
    root,
    runtime: 'nodejs20.x',
    logger: null,
  });

  const vcConfig = JSON.parse(
    fs.readFileSync(path.join(report.function, '.vc-config.json'), 'utf8'),
  );
  assert.equal(vcConfig.runtime, 'nodejs20.x');
});
