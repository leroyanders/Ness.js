import path from 'node:path';
import fs from 'fs-extra';

export function resolvePackageDirectory(packageName, cwd = process.cwd()) {
  let directory = path.resolve(cwd);
  while (true) {
    const packageDirectory = path.join(directory, 'node_modules', packageName);
    if (fs.existsSync(path.join(packageDirectory, 'package.json'))) {
      return fs.realpathSync(packageDirectory);
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error(
    `Cannot find ${packageName} from ${cwd}. Run npm install in the Ness application first.`,
  );
}

export function resolvePackageBin(packageName, cwd = process.cwd(), binName) {
  const directory = resolvePackageDirectory(packageName, cwd);
  const manifest = fs.readJsonSync(path.join(directory, 'package.json'));
  const bin =
    typeof manifest.bin === 'string'
      ? manifest.bin
      : binName
        ? manifest.bin?.[binName]
        : Object.values(manifest.bin || {})[0];
  if (!bin) {
    const suffix = binName ? ` named ${binName}` : '';
    throw new Error(
      `${packageName} does not expose a CLI executable${suffix}.`,
    );
  }
  return path.join(directory, bin);
}
