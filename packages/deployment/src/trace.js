import fs from 'node:fs';
import path from 'node:path';

function readManifest(directory) {
  const filename = path.join(directory, 'package.json');
  if (!fs.existsSync(filename)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch {
    return undefined;
  }
}

function realpath(target) {
  try {
    return fs.realpathSync(target);
  } catch {
    return target;
  }
}

/**
 * Resolves a package the way Node does: walk `node_modules` upwards from the
 * importing directory to the filesystem root, and resolve symlinks before
 * continuing the walk.
 *
 * Both details matter and both were wrong before:
 *
 * - Stopping at the application root breaks workspaces, where npm, yarn, and
 *   pnpm hoist nearly everything to the monorepo root — one or more levels
 *   above the app.
 * - Walking a symlink path lexically breaks pnpm, whose default layout makes
 *   `node_modules/foo` a link into `node_modules/.pnpm/foo@x/node_modules/foo`
 *   and puts foo's own dependencies beside it inside the store. Node avoids
 *   this by realpath-ing first.
 *
 * Returns undefined rather than throwing: optional and platform-specific
 * dependencies are routinely absent, and a missing one is not a build failure.
 */
function resolvePackageDirectory(name, from) {
  let directory = realpath(path.resolve(from));
  for (;;) {
    const candidate = path.join(directory, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return realpath(candidate);
    }
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

/**
 * Walks the production dependency graph from an application manifest and
 * returns the package directories that must ship with it.
 *
 * This traces at package granularity, not file granularity. That keeps the
 * output a few percent larger than a file-level tracer would, and in exchange
 * it never drops a file reached through a runtime `require`, a dynamic import,
 * or a native binding — the failure mode that makes file-level tracing
 * unpleasant to debug in production.
 *
 * devDependencies are excluded, which is where the size actually comes from.
 */
function traceDependencies(
  root,
  { manifest = readManifest(root), extra = [], onMissing } = {},
) {
  if (!manifest) throw new Error(`No package.json found in ${root}`);

  // Keyed by resolved directory, not by name: two versions of one package are
  // two distinct nodes, and keying by name would skip the second one's
  // subtree, silently omitting anything only it depends on.
  const visited = new Set();
  const packages = new Map();
  const conflicts = [];
  const missing = new Set();

  const queue = [...Object.keys(manifest.dependencies || {}), ...extra].map(
    name => ({ name, from: root, required: true }),
  );
  for (const name of Object.keys(manifest.optionalDependencies || {})) {
    queue.push({ name, from: root, required: false });
  }

  while (queue.length) {
    const { name, from, required, requiredBy } = queue.shift();
    const directory = resolvePackageDirectory(name, from);

    if (!directory) {
      // Optional dependencies are absent by design — most of them are
      // platform-specific native builds for architectures we are not on.
      if (required && !packages.has(name)) {
        missing.add(name);
        onMissing?.(name);
      }
      continue;
    }

    // The first resolution of a name is the one the application itself would
    // load, so that is the copy placed at the top level of the bundle.
    if (!packages.has(name)) {
      packages.set(name, directory);
    } else if (packages.get(name) !== directory && requiredBy) {
      // A second version of the same name. It cannot share the top level, so
      // record where it has to be nested for Node to resolve it.
      conflicts.push({ name, directory, requiredBy });
    }

    if (visited.has(directory)) continue;
    visited.add(directory);

    const packageManifest = readManifest(directory);
    if (!packageManifest) continue;

    for (const dependency of Object.keys(packageManifest.dependencies || {})) {
      queue.push({
        name: dependency,
        from: directory,
        required: true,
        requiredBy: packageManifest.name || name,
      });
    }
    for (const dependency of Object.keys(
      packageManifest.optionalDependencies || {},
    )) {
      queue.push({
        name: dependency,
        from: directory,
        required: false,
        requiredBy: packageManifest.name || name,
      });
    }
    // peerDependencies are deliberately not followed. A peer is the parent's
    // responsibility, so it is already reachable through the application's own
    // dependencies if it is actually used; following them here drags in the
    // whole universe of bundlers and linters a library merely tolerates.
  }

  return { packages, conflicts, missing: [...missing] };
}

export { readManifest, realpath, resolvePackageDirectory, traceDependencies };
