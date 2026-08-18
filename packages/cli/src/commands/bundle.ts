import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { paint } from '../lib/colors.js';
import { resolvePackageDirectory } from '../lib/packages.js';

export type BundleTarget = 'node' | 'cloudflare' | 'vercel';

export interface BundleOptions {
  cwd?: string;
  buildDirectory?: string;
  output?: string;
  runtime?: string;
  name?: string;
}

/** What the standalone and Vercel builders report back. */
export interface BundleReport {
  output: string;
  packages: number;
  bytes: number;
  missing: string[];
}

const TARGETS: BundleTarget[] = ['node', 'cloudflare', 'vercel'];

async function loadDeployment(
  cwd: string,
  subpath = '',
): Promise<Record<string, unknown>> {
  const directory = resolvePackageDirectory('@nessframework/deployment', cwd);
  const entry = path.join(directory, 'dist', `${subpath || 'index'}.js`);
  return import(pathToFileURL(entry).href) as Promise<Record<string, unknown>>;
}

interface NessConfigFile {
  ness?: { deployment?: Partial<BundleOptions> };
}

async function loadNessConfig(root: string): Promise<NessConfigFile> {
  const filename = ['ness.config.ts', 'ness.config.mjs', 'ness.config.js']
    .map(candidate => path.join(root, candidate))
    .find(fs.existsSync);
  if (!filename) return {};
  const module = (await import(pathToFileURL(filename).href)) as {
    default?: NessConfigFile;
  } & NessConfigFile;
  return module.default || module;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/**
 * Emits a self-contained Node deployment: build output, public assets, a traced
 * production node_modules, and a launcher. `node build/standalone/server.mjs`
 * runs it on a bare Node image with no install step.
 */
async function bundleNode(
  root: string,
  options: BundleOptions,
): Promise<BundleReport> {
  const { createStandaloneOutput } = (await loadDeployment(
    root,
    'standalone',
  )) as {
    createStandaloneOutput: (input: unknown) => Promise<BundleReport>;
  };
  const report = await createStandaloneOutput({
    root,
    buildDirectory: options.buildDirectory,
    outputDirectory: options.output,
    logger: null,
  });

  console.log(
    `${paint('green', 'Standalone bundle')} ${path.relative(root, report.output) || report.output}`,
  );
  console.log(
    `  ${report.packages} package(s), ${formatBytes(report.bytes)} total`,
  );
  if (report.missing.length) {
    console.warn(
      paint(
        'yellow',
        `  ${report.missing.length} declared dependency/dependencies were not installed and were skipped: ${report.missing.join(', ')}`,
      ),
    );
  }
  console.log(
    `  Start it with: ${paint('cyan', `node ${path.join(path.relative(root, report.output) || '.', 'server.mjs')}`)}`,
  );
  return report;
}

/**
 * Writes the Worker entry and a wrangler configuration matching the build
 * layout. The build itself is produced by `ness build`; this only adds the
 * runtime shim Cloudflare needs.
 */
async function bundleCloudflare(
  root: string,
  options: BundleOptions,
): Promise<{ worker: string; config: string }> {
  const { createWorkerConfig, workerEntry } = (await loadDeployment(
    root,
    'cloudflare',
  )) as {
    createWorkerConfig: (input: {
      name: string;
      buildDirectory: string;
    }) => unknown;
    workerEntry: (input: { configPath?: string | undefined }) => string;
  };
  const buildDirectory = options.buildDirectory || 'build';
  const workerDirectory = path.join(root, buildDirectory, 'worker');
  const serverBuild = path.join(root, buildDirectory, 'server', 'index.js');
  if (!fs.existsSync(serverBuild)) {
    throw new Error(
      `No server build at ${serverBuild}. Run \`ness build\` before bundling.`,
    );
  }

  fs.mkdirSync(workerDirectory, { recursive: true });

  // A Worker cannot read a file at runtime, so the config has to be imported
  // statically — and `ness.config.mjs` cannot be, because it imports Vite
  // plugins at module scope. A runtime-only config file can.
  const runtimeConfig = [
    'ness.server.config.ts',
    'ness.server.config.mjs',
    'ness.server.config.js',
  ].find(candidate => fs.existsSync(path.join(root, candidate)));
  fs.writeFileSync(
    path.join(workerDirectory, 'index.js'),
    workerEntry({
      configPath: runtimeConfig ? `../../${runtimeConfig}` : undefined,
    }),
  );

  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  ) as { name?: string };
  const config = createWorkerConfig({
    name: options.name || manifest.name || 'ness-app',
    buildDirectory,
  });
  const configFile = path.join(root, 'wrangler.json');
  fs.writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`);

  console.log(
    `${paint('green', 'Cloudflare Worker')} ${path.relative(root, workerDirectory)}`,
  );
  console.log(`  Wrangler config: ${path.relative(root, configFile)}`);
  console.log(`  Deploy it with: ${paint('cyan', 'npx wrangler deploy')}`);
  if (runtimeConfig) {
    console.log(`  Runtime config: ${runtimeConfig}`);
  } else if (
    ['ness.config.ts', 'ness.config.mjs'].some(candidate =>
      fs.existsSync(path.join(root, candidate)),
    )
  ) {
    console.warn(
      paint(
        'yellow',
        '  ness.config.mjs was not bundled: it imports Vite plugins, which cannot run on a Worker.',
      ),
    );
    console.warn(
      `  Move the ${paint('cyan', 'server')} and ${paint('cyan', 'instrumentation')} sections into ${paint('cyan', 'ness.server.config.mjs')} to have them applied here.`,
    );
  }
  console.warn(
    paint(
      'yellow',
      '  Image optimization and the filesystem cache adapter are unavailable on Workers.',
    ),
  );
  return { worker: workerDirectory, config: configFile };
}

/**
 * Emits a Vercel Build Output API v3 deployment: a Node.js Function with a
 * traced production `node_modules` plus the (optional) Nest build, and the
 * client build as static files. Meant to run as part of `vercel.json`'s
 * `buildCommand` (`ness build && ness bundle vercel`) — Vercel serves
 * whatever `.vercel/output` contains directly, with no tracing or size-limited
 * glob config of its own to fight.
 */
async function bundleVercel(
  root: string,
  options: BundleOptions,
): Promise<BundleReport> {
  const { createVercelOutput } = (await loadDeployment(root, 'vercel')) as {
    createVercelOutput: (input: unknown) => Promise<BundleReport>;
  };
  const report = await createVercelOutput({
    root,
    buildDirectory: options.buildDirectory,
    outputDirectory: options.output,
    runtime: options.runtime,
    logger: null,
  });

  console.log(
    `${paint('green', 'Vercel Build Output')} ${path.relative(root, report.output) || report.output}`,
  );
  console.log(
    `  ${report.packages} package(s), ${formatBytes(report.bytes)} (function)`,
  );
  if (report.missing.length) {
    console.warn(
      paint(
        'yellow',
        `  ${report.missing.length} declared dependency/dependencies were not installed and were skipped: ${report.missing.join(', ')}`,
      ),
    );
  }
  console.log(
    '  Runs as part of your vercel.json buildCommand — nothing further to run here.',
  );
  return report;
}

export async function bundle(
  target: BundleTarget | string = 'node',
  options: BundleOptions = {},
): Promise<BundleReport | { worker: string; config: string }> {
  if (!TARGETS.includes(target as BundleTarget)) {
    throw new Error(
      `Unknown deployment target: ${target}. Supported targets: ${TARGETS.join(', ')}.`,
    );
  }
  const root = path.resolve(options.cwd || process.cwd());
  const config = await loadNessConfig(root);
  const deployment = config?.ness?.deployment || {};
  const resolved: BundleOptions = {
    buildDirectory: 'build',
    ...deployment,
    ...options,
  };

  if (target === 'cloudflare') return bundleCloudflare(root, resolved);
  if (target === 'vercel') return bundleVercel(root, resolved);
  return bundleNode(root, resolved);
}

export { TARGETS };
