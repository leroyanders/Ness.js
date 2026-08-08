import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { paint } from '../lib/colors.js';
import { resolvePackageDirectory } from '../lib/packages.js';

const TARGETS = ['node', 'cloudflare'];

async function loadDeployment(cwd, subpath = '') {
  const directory = resolvePackageDirectory('@nessframework/deployment', cwd);
  const entry = path.join(directory, 'src', `${subpath || 'index'}.js`);
  return import(pathToFileURL(entry).href);
}

async function loadNessConfig(root) {
  const filename = ['ness.config.mjs', 'ness.config.js']
    .map(candidate => path.join(root, candidate))
    .find(fs.existsSync);
  if (!filename) return {};
  const module = await import(pathToFileURL(filename).href);
  return module.default || module;
}

function formatBytes(bytes) {
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/**
 * Emits a self-contained Node deployment: build output, public assets, a traced
 * production node_modules, and a launcher. `node build/standalone/server.mjs`
 * runs it on a bare Node image with no install step.
 */
async function bundleNode(root, options) {
  const { createStandaloneOutput } = await loadDeployment(root, 'standalone');
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
async function bundleCloudflare(root, options) {
  const { createWorkerConfig, workerEntry } = await loadDeployment(
    root,
    'cloudflare',
  );
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
  );
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
  } else if (fs.existsSync(path.join(root, 'ness.config.mjs'))) {
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

export async function bundle(target = 'node', options = {}) {
  if (!TARGETS.includes(target)) {
    throw new Error(
      `Unknown deployment target: ${target}. Supported targets: ${TARGETS.join(', ')}.`,
    );
  }
  const root = path.resolve(options.cwd || process.cwd());
  const config = await loadNessConfig(root);
  const deployment = config?.ness?.deployment || {};
  const resolved = {
    buildDirectory: 'build',
    ...deployment,
    ...options,
  };

  return target === 'cloudflare'
    ? bundleCloudflare(root, resolved)
    : bundleNode(root, resolved);
}

export { TARGETS };
