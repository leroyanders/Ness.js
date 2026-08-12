import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
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
  // A namespace import, not a default import: a runtime config module with
  // only named exports (this project's own convention — `export const
  // server = ...`) has no default export at all, so `import config from`
  // fails to *link*, a SyntaxError before `serverConfig()`'s own
  // `config?.default ?? config` leniency ever gets a chance to run.
  assert.match(
    withConfig,
    /import \* as config from '\.\/ness\.server\.config\.mjs'/,
  );
  assert.match(
    withConfig,
    /createVercelHandler\(\{ build, root, config \}\)/,
  );
});

test('a namespace import of a named-exports-only runtime config round-trips through serverConfig', async () => {
  // The exact scenario that broke: `vercelEntry` generates `import * as
  // config from '<path>'`, and that config module — like this project's own
  // ness.server.config.mjs — exports `server`/`instrumentation` as named
  // bindings with no `default` at all. This is a real import, not a string
  // match, so it also proves the import *links* successfully, which a
  // `node --check` syntax check cannot: "does not provide an export named
  // 'default'" is a module-linking error, one stage past parsing.
  const { serverConfig } = await import('@nessframework/server/runtime');
  const fixtureDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ness-vercel-config-'),
  );
  const configFile = path.join(fixtureDirectory, 'ness.server.config.mjs');
  fs.writeFileSync(
    configFile,
    'export const server = { trustProxy: true };\nexport const instrumentation = undefined;\n',
  );

  const config = await import(`file://${configFile}`);
  const { server } = serverConfig(config);
  assert.equal(server.trustProxy, true);

  fs.rmSync(fixtureDirectory, { recursive: true, force: true });
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

  // Without a package.json declaring `type: module` right next to it, Node
  // has nothing to learn the entry's module system from once it's the only
  // thing under the deployed function root — and falls back to CommonJS,
  // which fails on the entry's own `import` statements before anything of
  // ours runs at all. Caught for real by parsing the generated file the same
  // way the deployed runtime would, not just by asserting the field exists.
  const functionManifest = JSON.parse(
    fs.readFileSync(path.join(functionDirectory, 'package.json'), 'utf8'),
  );
  assert.equal(functionManifest.type, 'module');
  assert.doesNotThrow(
    () =>
      execFileSync(process.execPath, [
        '--check',
        path.join(functionDirectory, 'index.js'),
      ]),
    'the generated entry must parse as ESM given only the files createVercelOutput itself wrote',
  );

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
  // Named exports only, no default — this project's own convention (and
  // serve.js's own loader tries `.default` before falling back to the whole
  // module for exactly this reason). A default-exported fixture here would
  // pass even with the old, broken default-import entry.
  fs.writeFileSync(
    path.join(root, 'ness.server.config.mjs'),
    'export const server = {};\nexport const instrumentation = undefined;\n',
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
  assert.match(
    entry,
    /import \* as config from '\.\/ness\.server\.config\.mjs'/,
  );
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
