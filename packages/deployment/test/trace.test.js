import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { resolvePackageDirectory, traceDependencies } from '../src/trace.js';

function createPackage(root, location, manifest) {
  const directory = path.join(root, location);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify(manifest),
  );
  return directory;
}

function createTree(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-trace-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'app',
      dependencies: { runtime: '^1.0.0' },
      devDependencies: { bundler: '^1.0.0' },
    }),
  );
  createPackage(root, 'node_modules/runtime', {
    name: 'runtime',
    version: '1.0.0',
    dependencies: { helper: '^1.0.0' },
  });
  createPackage(root, 'node_modules/helper', {
    name: 'helper',
    version: '1.0.0',
  });
  createPackage(root, 'node_modules/bundler', {
    name: 'bundler',
    version: '1.0.0',
    dependencies: { 'bundler-dep': '^1.0.0' },
  });
  createPackage(root, 'node_modules/bundler-dep', {
    name: 'bundler-dep',
    version: '1.0.0',
  });
  return root;
}

test('tracing follows runtime dependencies and skips devDependencies', async t => {
  const root = createTree(t);
  const { packages, missing } = traceDependencies(root);

  assert.deepEqual([...packages.keys()].sort(), ['helper', 'runtime']);
  assert.deepEqual(missing, []);
});

test('devDependencies can be included explicitly', async t => {
  const root = createTree(t);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  const { packages } = traceDependencies(root, {
    manifest: {
      ...manifest,
      dependencies: { ...manifest.dependencies, ...manifest.devDependencies },
    },
  });

  assert.deepEqual([...packages.keys()].sort(), [
    'bundler',
    'bundler-dep',
    'helper',
    'runtime',
  ]);
});

test('peer dependencies are not followed', async t => {
  const root = createTree(t);
  createPackage(root, 'node_modules/runtime', {
    name: 'runtime',
    version: '1.0.0',
    peerDependencies: { bundler: '^1.0.0' },
  });

  const { packages } = traceDependencies(root);
  assert.ok(
    !packages.has('bundler'),
    'a peer is the parent application’s responsibility, not a runtime edge',
  );
});

test('a missing required dependency is reported; a missing optional one is not', async t => {
  const root = createTree(t);
  createPackage(root, 'node_modules/runtime', {
    name: 'runtime',
    version: '1.0.0',
    dependencies: { absent: '^1.0.0' },
    optionalDependencies: { 'native-darwin-arm64': '^1.0.0' },
  });

  const reported = [];
  const { missing } = traceDependencies(root, {
    onMissing: name => reported.push(name),
  });

  assert.deepEqual(missing, ['absent']);
  assert.deepEqual(reported, ['absent']);
});

test('a nested copy is preferred over the hoisted one', async t => {
  const root = createTree(t);
  const nested = createPackage(
    root,
    'node_modules/runtime/node_modules/helper',
    {
      name: 'helper',
      version: '2.0.0',
    },
  );

  const resolved = resolvePackageDirectory(
    'helper',
    path.join(root, 'node_modules', 'runtime'),
    root,
  );
  assert.equal(fs.realpathSync(resolved), fs.realpathSync(nested));
});

test('extraPackages pull in modules nothing declares', async t => {
  const root = createTree(t);
  const { packages } = traceDependencies(root, { extra: ['bundler'] });
  assert.ok(packages.has('bundler'));
});

test('a cyclic dependency graph terminates', async t => {
  const root = createTree(t);
  createPackage(root, 'node_modules/runtime', {
    name: 'runtime',
    version: '1.0.0',
    dependencies: { helper: '^1.0.0' },
  });
  createPackage(root, 'node_modules/helper', {
    name: 'helper',
    version: '1.0.0',
    dependencies: { runtime: '^1.0.0' },
  });

  const { packages } = traceDependencies(root);
  assert.deepEqual([...packages.keys()].sort(), ['helper', 'runtime']);
});
