import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { resolvePackageDirectory, traceDependencies } from '../dist/trace.js';

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

/* Regressions found by adversarial review of the tracer. */

test('a dependency hoisted above the application root is found', async t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-trace-ws-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  // A monorepo: the app lives in packages/app and its dependency is hoisted to
  // the workspace root, which is above the app.
  const app = path.join(workspace, 'packages', 'app');
  fs.mkdirSync(app, { recursive: true });
  fs.writeFileSync(
    path.join(app, 'package.json'),
    JSON.stringify({ name: 'app', dependencies: { hoisted: '^1.0.0' } }),
  );
  createPackage(workspace, 'node_modules/hoisted', {
    name: 'hoisted',
    version: '1.0.0',
  });

  const { packages, missing } = traceDependencies(app);
  assert.deepEqual(missing, [], 'a hoisted dependency is not missing');
  assert.ok(packages.has('hoisted'));
});

test('a pnpm-style symlinked layout resolves transitive dependencies', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-trace-pnpm-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'app', dependencies: { outer: '^1.0.0' } }),
  );
  // The store: outer and its dependency inner live side by side.
  const store = path.join(
    root,
    'node_modules',
    '.pnpm',
    'outer@1.0.0',
    'node_modules',
  );
  createPackage(
    root,
    path.join('node_modules', '.pnpm', 'outer@1.0.0', 'node_modules', 'outer'),
    {
      name: 'outer',
      version: '1.0.0',
      dependencies: { inner: '^1.0.0' },
    },
  );
  createPackage(
    root,
    path.join('node_modules', '.pnpm', 'outer@1.0.0', 'node_modules', 'inner'),
    {
      name: 'inner',
      version: '1.0.0',
    },
  );
  // Only the direct dependency is exposed at the top level, as a symlink.
  fs.symlinkSync(
    path.join(store, 'outer'),
    path.join(root, 'node_modules', 'outer'),
  );

  const { packages, missing } = traceDependencies(root);
  assert.deepEqual(
    missing,
    [],
    'transitive deps must resolve through the link',
  );
  assert.ok(packages.has('outer'));
  assert.ok(packages.has('inner'), 'the store sibling is reachable');
});

test('a second version of a package keeps its own dependency subtree', async t => {
  const root = createTree(t);
  // The app uses shared@1 directly; runtime pins shared@2, which npm nests.
  // Only shared@2 needs `deep`.
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'app',
      dependencies: { runtime: '^1.0.0', shared: '^1.0.0' },
    }),
  );
  createPackage(root, 'node_modules/runtime/node_modules/shared', {
    name: 'shared',
    version: '2.0.0',
    dependencies: { deep: '^1.0.0' },
  });
  createPackage(root, 'node_modules/shared', {
    name: 'shared',
    version: '1.0.0',
  });
  createPackage(root, 'node_modules/deep', { name: 'deep', version: '1.0.0' });
  createPackage(root, 'node_modules/runtime', {
    name: 'runtime',
    version: '1.0.0',
    dependencies: { shared: '^2.0.0' },
  });

  const { packages, conflicts } = traceDependencies(root);
  assert.ok(
    packages.has('deep'),
    'a dependency reached only through the second version must still be traced',
  );
  assert.ok(
    conflicts.some(entry => entry.name === 'shared'),
    'the losing version is reported so it can be nested',
  );
});

/*
 * Regression: real bug found bundling multer for Vercel. Two *different*
 * `type-is` instances (one hoisted to the top level, one bundled inside
 * `multer`) each depend on a `media-typer` that conflicts with a third,
 * unrelated package's own `media-typer` — which happens to win the top-level
 * slot. Both `type-is` instances' conflicting deps used to be reported with
 * the same bare `requiredBy: 'type-is'` (derived from the package *name*,
 * not which physical copy of it), so their two different `media-typer`s
 * collapsed onto the same nested destination and one silently overwrote the
 * other. At runtime, multer's own `type-is` — which needs the version that
 * lost that race — walks up past its own now-empty `node_modules` and
 * resolves the *unrelated* package's `media-typer` instead of its own.
 */
test('two different-named-alike packages nest their own conflicting dependencies separately', async t => {
  const root = createTree(t);
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'app',
      // first-wins wins the top-level `media-typer` slot ahead of both
      // `type-is` instances, forcing *both* of their needs to conflict.
      dependencies: {
        'first-wins': '^1.0.0',
        'type-is': '^1.0.0',
        bundler: '^1.0.0',
      },
    }),
  );
  createPackage(root, 'node_modules/first-wins', {
    name: 'first-wins',
    version: '1.0.0',
    dependencies: { 'media-typer': '^1.0.0' },
  });
  createPackage(root, 'node_modules/first-wins/node_modules/media-typer', {
    name: 'media-typer',
    version: '9.9.9',
  });
  createPackage(root, 'node_modules/type-is', {
    name: 'type-is',
    version: '1.0.0',
    dependencies: { 'media-typer': '^1.0.0' },
  });
  createPackage(root, 'node_modules/type-is/node_modules/media-typer', {
    name: 'media-typer',
    version: '1.0.0',
  });
  createPackage(root, 'node_modules/bundler', {
    name: 'bundler',
    version: '1.0.0',
    dependencies: { 'type-is': '^2.0.0' },
  });
  createPackage(root, 'node_modules/bundler/node_modules/type-is', {
    name: 'type-is',
    version: '2.0.0',
    dependencies: { 'media-typer': '^0.3.0' },
  });
  createPackage(root, 'node_modules/bundler/node_modules/media-typer', {
    name: 'media-typer',
    version: '0.3.0',
  });

  const { packages, conflicts } = traceDependencies(root);

  const typeIsConflict = conflicts.find(
    entry => entry.name === 'type-is' && entry.requiredBy === 'bundler',
  );
  assert.ok(typeIsConflict, 'the nested type-is is reported as a conflict');

  const mediaTyperConflicts = conflicts.filter(
    entry => entry.name === 'media-typer',
  );
  const forTopLevelTypeIs = mediaTyperConflicts.find(
    entry => entry.requiredBy === 'type-is',
  );
  const forBundledTypeIs = mediaTyperConflicts.find(
    entry => entry.requiredBy === 'bundler/node_modules/type-is',
  );

  assert.ok(
    forTopLevelTypeIs,
    'the top-level type-is keeps its own media-typer destination',
  );
  assert.ok(
    forBundledTypeIs,
    "the type-is bundled inside another package gets its own distinct destination, not the top-level one's",
  );
  assert.notEqual(
    forTopLevelTypeIs.directory,
    forBundledTypeIs.directory,
    'they must resolve to the two genuinely different on-disk copies',
  );
  assert.equal(
    fs.realpathSync(packages.get('media-typer')),
    fs.realpathSync(
      path.join(root, 'node_modules/first-wins/node_modules/media-typer'),
    ),
    'the unrelated package that happened to resolve first still owns the top-level slot',
  );
});
