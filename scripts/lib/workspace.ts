import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

export interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
}

/**
 * Runs a command and resolves with its combined output, rejecting with that
 * output attached so a failure is diagnosable without re-running.
 */
function run(
  command: string,
  args: string[],
  { cwd, env, timeout = 15 * 60_000 }: RunOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    const capture = (chunk: string) => {
      output += chunk;
    };
    child.stdout.setEncoding('utf8').on('data', capture);
    child.stderr.setEncoding('utf8').on('data', capture);

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(
        new Error(
          `${command} ${args.join(' ')} timed out after ${timeout}ms\n${output}`,
        ),
      );
    }, timeout);

    child.on('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else
        reject(
          new Error(
            `${command} ${args.join(' ')} exited with ${code}\n${output}`,
          ),
        );
    });
  });
}

/** Package name to the tarball `npm pack` wrote for it. */
export type Tarballs = Map<string, string>;

interface PackedResult {
  filename: string;
  files: unknown[];
}

/**
 * Packs every workspace package so a scaffolded application installs the code
 * in this tree instead of whatever is on the registry.
 *
 * Packing rather than symlinking is deliberate: `npm pack` honours each
 * package's `files` field, so a file that exists locally but is missing from
 * the published tarball fails here rather than in a user's first install.
 */
async function packWorkspace(
  destination: string,
  { onPack }: { onPack?: (name: string, files: number) => void } = {},
): Promise<Tarballs> {
  fs.mkdirSync(destination, { recursive: true });
  const directories = ['packages', 'plugins'].flatMap(group =>
    fs
      .readdirSync(path.join(ROOT, group), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(ROOT, group, entry.name)),
  );

  const tarballs: Tarballs = new Map();
  for (const directory of directories) {
    const manifestPath = path.join(directory, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      name?: string;
    };
    if (!manifest.name?.startsWith('@nessframework/')) continue;

    const output = await run(
      'npm',
      [
        'pack',
        '--workspace',
        manifest.name,
        '--pack-destination',
        destination,
        '--json',
        '--loglevel',
        'error',
      ],
      { cwd: ROOT },
    );
    const [packed] = JSON.parse(
      output.slice(output.indexOf('[')),
    ) as PackedResult[];
    tarballs.set(manifest.name, path.join(destination, packed!.filename));
    onPack?.(manifest.name, packed!.files.length);
  }
  return tarballs;
}

/**
 * `ness new --package-override` arguments installing the packed tarballs, so
 * peer ranges resolve against the working tree from the first install rather
 * than being patched up afterwards.
 */
function overrideArguments(tarballs: Tarballs): string[] {
  return [...tarballs].flatMap(([name, tarball]) => [
    '--package-override',
    `${name}=file:${tarball}`,
  ]);
}

/** Pins transitive references so nothing falls back to a registry copy. */
function pinTransitiveDependencies(
  appDirectory: string,
  tarballs: Tarballs,
): void {
  const manifestPath = path.join(appDirectory, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    overrides?: Record<string, string>;
  };
  const direct = new Set([
    ...Object.keys(manifest.dependencies || {}),
    ...Object.keys(manifest.devDependencies || {}),
  ]);
  manifest.overrides = { ...(manifest.overrides || {}) };
  for (const [name, tarball] of tarballs) {
    // npm rejects an override that restates a direct dependency, and those
    // already point at the tarball via --package-override.
    if (direct.has(name)) continue;
    manifest.overrides[name] = `file:${tarball}`;
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

export {
  ROOT,
  overrideArguments,
  packWorkspace,
  pinTransitiveDependencies,
  run,
};
