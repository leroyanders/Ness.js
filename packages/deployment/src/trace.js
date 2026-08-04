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

/**
 * Resolves a package by walking node_modules upwards, the way Node itself does.
 * Returns undefined rather than throwing: optional and platform-specific
 * dependencies are routinely absent, and a missing one is not a build failure.
 */
function resolvePackageDirectory(name, from, root) {
  let directory = path.resolve(from);
  const stop = path.resolve(root);
  for (;;) {
    const candidate = path.join(directory, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    if (directory === stop) break;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  const fallback = path.join(stop, 'node_modules', name);
  return fs.existsSync(path.join(fallback, 'package.json'))
    ? fallback
    : undefined;
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

  const visited = new Map();
  const missing = new Set();
  const queue = [...Object.keys(manifest.dependencies || {}), ...extra].map(
    name => ({ name, from: root, required: true }),
  );
  for (const name of Object.keys(manifest.optionalDependencies || {})) {
    queue.push({ name, from: root, required: false });
  }

  while (queue.length) {
    const { name, from, required } = queue.shift();
    if (visited.has(name)) continue;

    const directory = resolvePackageDirectory(name, from, root);
    if (!directory) {
      // Optional dependencies are absent by design — most of them are
      // platform-specific native builds for architectures we are not on.
      if (required) {
        missing.add(name);
        onMissing?.(name);
      }
      continue;
    }

    const packageManifest = readManifest(directory);
    visited.set(name, directory);
    if (!packageManifest) continue;

    for (const dependency of Object.keys(packageManifest.dependencies || {})) {
      if (!visited.has(dependency)) {
        queue.push({ name: dependency, from: directory, required: true });
      }
    }
    for (const dependency of Object.keys(
      packageManifest.optionalDependencies || {},
    )) {
      if (!visited.has(dependency)) {
        queue.push({ name: dependency, from: directory, required: false });
      }
    }
    // peerDependencies are deliberately not followed. A peer is the parent's
    // responsibility, so it is already reachable through the application's own
    // dependencies if it is actually used; following them here drags in the
    // whole universe of bundlers and linters a library merely tolerates.
  }

  return { packages: visited, missing: [...missing] };
}

export { readManifest, resolvePackageDirectory, traceDependencies };
