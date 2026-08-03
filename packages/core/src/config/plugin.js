import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function normalizePlugin(plugin) {
  if (typeof plugin === 'function') return { install: plugin };
  if (plugin && typeof plugin.install === 'function') return plugin;
  if (plugin && typeof plugin.func === 'function')
    return { install: plugin.func };
  if (plugin && plugin.object && typeof plugin.object.install === 'function')
    return plugin.object;
  throw new TypeError(
    'A Ness plugin must export an install(config, options) function.',
  );
}

function resolvePackageDirectory(packageName, cwd = process.cwd()) {
  let directory = path.resolve(cwd);
  while (true) {
    const packageDirectory = path.join(directory, 'node_modules', packageName);
    if (fs.existsSync(path.join(packageDirectory, 'package.json'))) {
      return fs.realpathSync(packageDirectory);
    }
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

function packageEntry(packageDirectory) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'),
  );
  const rootExport = manifest.exports?.['.'] ?? manifest.exports;
  const exported =
    typeof rootExport === 'string'
      ? rootExport
      : rootExport?.import || rootExport?.default;
  return path.resolve(
    packageDirectory,
    exported || manifest.main || 'index.js',
  );
}

async function loadPlugin(plugin) {
  if (
    typeof plugin !== 'string' &&
    (!plugin || typeof plugin.name !== 'string')
  ) {
    return normalizePlugin(plugin);
  }

  const name = typeof plugin === 'string' ? plugin : plugin.name;
  const isScoped = name.startsWith('@') && name.includes('/');
  const [scope, scopedName] = isScoped ? name.split('/') : [];
  const candidates = [
    isScoped && `${scope}/ness-${scopedName}`,
    isScoped && name,
    !isScoped && name.startsWith('ness-') && name,
    !isScoped && `ness-${name}`,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const directory = resolvePackageDirectory(candidate);
    if (!directory) continue;
    const loaded = await import(pathToFileURL(packageEntry(directory)).href);
    return normalizePlugin(
      typeof loaded.install === 'function' ? loaded : loaded.default || loaded,
    );
  }

  throw new Error(
    `Unable to find a Ness plugin. Tried: ${candidates.join(', ')}`,
  );
}

export { loadPlugin, normalizePlugin };
export default loadPlugin;
