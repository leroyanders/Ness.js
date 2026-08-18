#!/usr/bin/env node
/**
 * Benchmarks Ness.js against Next.js on the same application.
 *
 * Both apps render the same catalogue from the same module: a dynamic list
 * page, a dynamic detail page, and a JSON endpoint. Both are measured as
 * self-hosted Node servers (Next uses `output: 'standalone'`), because that is
 * the deployment Ness targets — comparing a self-hosted server against a
 * Vercel deployment would measure the platform, not the framework.
 *
 * Every number here is produced by this script on the machine that runs it.
 * Absolute values depend on the hardware; the ratio between the two columns is
 * the part worth quoting.
 *
 *   node scripts/bench/run.ts
 *   node scripts/bench/run.ts --only=ness --duration=20 --connections=100
 */
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {
  ROOT,
  overrideArguments,
  packWorkspace,
  pinTransitiveDependencies,
  run,
} from '../lib/workspace.ts';
import type { Tarballs } from '../lib/workspace.ts';

const FIXTURES = path.join(ROOT, 'scripts', 'bench', 'fixtures');

interface Options {
  only: string[];
  duration: number;
  connections: number;
  warmup: number;
  keep: boolean;
  workdir?: string;
}

interface LoadResult {
  requests: number;
  errors: number;
  rps: number;
  p50: number;
  p95: number;
  p99: number;
}

interface RouteResult extends LoadResult {
  name: string;
  path: string;
  ttfb: number;
}

interface Target {
  name: string;
  appDirectory: string;
  buildMs: number;
  installBytes: number;
  deployBytes: number;
  clientBytes: number;
  start: (port: number) => ChildProcess;
}

interface Measured extends Target {
  coldStartMs: number;
  routes: RouteResult[];
}

const ROUTES = [
  { name: 'list page (SSR)', path: '/' },
  { name: 'detail page (SSR)', path: '/products/42' },
  { name: 'JSON endpoint', path: '/api/health' },
];

function parseArguments(argv: string[]): Options {
  const options: Options = {
    only: ['ness', 'next'],
    duration: 10,
    connections: 50,
    warmup: 200,
    keep: false,
  };
  for (const argument of argv) {
    if (argument === '--keep') options.keep = true;
    else if (argument.startsWith('--only=')) {
      options.only = argument.slice('--only='.length).split(',');
    } else if (argument.startsWith('--duration=')) {
      options.duration = Number(argument.slice('--duration='.length));
    } else if (argument.startsWith('--connections=')) {
      options.connections = Number(argument.slice('--connections='.length));
    } else if (argument.startsWith('--workdir=')) {
      options.workdir = path.resolve(argument.slice('--workdir='.length));
    }
  }
  return options;
}

const log = (message: string): void =>
  console.log(`\x1b[36m[bench]\x1b[0m ${message}`);
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

function directorySize(directory: string): number {
  if (!fs.existsSync(directory)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) total += directorySize(target);
    else if (entry.isFile()) total += fs.statSync(target).size;
  }
  return total;
}

function copyDirectory(source: string, destination: string): void {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to);
    else fs.copyFileSync(from, to);
  }
}

async function timed<T>(
  label: string,
  work: () => Promise<T>,
): Promise<{ ms: number; value: T }> {
  const started = process.hrtime.bigint();
  const value = await work();
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  log(`${label}: ${(ms / 1000).toFixed(1)}s`);
  return { ms, value };
}

/**
 * Time from spawning the server process to its first successful response.
 * Measured on a cold process, which is what a container restart or a scale-up
 * event actually costs.
 */
async function measureColdStart(
  start: () => ChildProcess,
  url: string,
): Promise<{ child: ChildProcess; ms: number; output: string }> {
  const started = process.hrtime.bigint();
  const child = start();
  let output = '';
  child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
    output += chunk;
  });
  child.stderr?.setEncoding('utf8').on('data', (chunk: string) => {
    output += chunk;
  });

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited with ${child.exitCode}\n${output}`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) {
        await response.arrayBuffer();
        return {
          child,
          ms: Number(process.hrtime.bigint() - started) / 1e6,
          output,
        };
      }
    } catch {
      // Not listening yet.
    }
    await sleep(25);
  }
  throw new Error(`Server never became ready\n${output}`);
}

function percentile(sorted: number[], fraction: number): number {
  if (!sorted.length) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(fraction * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
}

/**
 * Fixed-concurrency closed loop: `connections` workers each request in a tight
 * sequence for `duration` seconds. Simple, dependency-free, and adequate for
 * comparing two servers on the same machine in the same run.
 */
async function measureThroughput(
  url: string,
  { duration, connections }: { duration: number; connections: number },
): Promise<LoadResult> {
  const latencies: number[] = [];
  let errors = 0;
  const deadline = Date.now() + duration * 1000;

  async function worker() {
    while (Date.now() < deadline) {
      const started = process.hrtime.bigint();
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10_000),
        });
        await response.arrayBuffer();
        if (!response.ok) errors += 1;
        else latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
      } catch {
        errors += 1;
      }
    }
  }

  const started = Date.now();
  await Promise.all(Array.from({ length: connections }, worker));
  const elapsed = (Date.now() - started) / 1000;
  const sorted = [...latencies].sort((a, b) => a - b);

  return {
    requests: latencies.length,
    errors,
    rps: latencies.length / elapsed,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
  };
}

async function measureTtfb(url: string, samples = 30): Promise<number> {
  const values: number[] = [];
  for (let index = 0; index < samples; index += 1) {
    const started = process.hrtime.bigint();
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    // Reading one chunk approximates time-to-first-byte for a streamed
    // response; awaiting the whole body would measure completion instead.
    const reader = response.body?.getReader();
    await reader?.read();
    await reader?.cancel();
    values.push(Number(process.hrtime.bigint() - started) / 1e6);
  }
  return percentile(
    values.sort((a, b) => a - b),
    0.5,
  );
}

function killTree(child: ChildProcess | undefined): void {
  if (!child || child.exitCode !== null) return;
  try {
    process.kill(-(child.pid ?? 0), 'SIGKILL');
  } catch {
    child.kill('SIGKILL');
  }
}

async function prepareNess(
  workdir: string,
  tarballs: Tarballs,
): Promise<Target> {
  const appDirectory = path.join(workdir, 'ness-app');
  log('scaffolding the Ness application');
  await run(
    process.execPath,
    [
      // The CLI ships compiled; its bin lives under dist.
      path.join(ROOT, 'packages', 'cli', 'dist', 'bin', 'index.js'),
      'new',
      appDirectory,
      '--template',
      path.join(ROOT, 'templates', 'minimal'),
      // Benchmark the code in this tree, not the published release.
      ...overrideArguments(tarballs),
    ],
    { cwd: workdir },
  );
  pinTransitiveDependencies(appDirectory, tarballs);
  await run(
    'npm',
    ['install', '--no-audit', '--no-fund', '--loglevel', 'error'],
    { cwd: appDirectory },
  );

  // Replace the template routes and config with the benchmark fixture. The
  // config matters as much as the routes: see the note in it about caching.
  fs.rmSync(path.join(appDirectory, 'app', 'routes'), {
    recursive: true,
    force: true,
  });
  fs.copyFileSync(
    path.join(FIXTURES, 'ness', 'ness.config.ts'),
    path.join(appDirectory, 'ness.config.ts'),
  );
  copyDirectory(
    path.join(FIXTURES, 'ness', 'app'),
    path.join(appDirectory, 'app'),
  );
  fs.copyFileSync(
    path.join(FIXTURES, 'shared', 'catalog.ts'),
    path.join(appDirectory, 'app', 'catalog.ts'),
  );

  const build = await timed('Ness build', () =>
    run('npm', ['run', 'build'], { cwd: appDirectory }),
  );
  await run(
    process.execPath,
    [path.join(appDirectory, 'node_modules', '.bin', 'ness'), 'bundle', 'node'],
    { cwd: appDirectory },
  );

  return {
    name: 'Ness.js',
    appDirectory,
    buildMs: build.ms,
    installBytes: directorySize(path.join(appDirectory, 'node_modules')),
    deployBytes: directorySize(path.join(appDirectory, 'build', 'standalone')),
    clientBytes: directorySize(
      path.join(appDirectory, 'build', 'client', 'assets'),
    ),
    start: (port: number) =>
      spawn(process.execPath, ['server.mjs'], {
        cwd: path.join(appDirectory, 'build', 'standalone'),
        env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      }),
  };
}

async function prepareNext(workdir: string): Promise<Target> {
  const appDirectory = path.join(workdir, 'next-app');
  log('creating the Next.js application');
  fs.mkdirSync(appDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(appDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'next-bench',
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: { build: 'next build' },
      },
      null,
      2,
    )}\n`,
  );
  copyDirectory(path.join(FIXTURES, 'next'), appDirectory);
  fs.copyFileSync(
    path.join(FIXTURES, 'shared', 'catalog.ts'),
    path.join(appDirectory, 'catalog.ts'),
  );

  await run(
    'npm',
    [
      'install',
      '--no-audit',
      '--no-fund',
      '--loglevel',
      'error',
      'next',
      'react',
      'react-dom',
    ],
    { cwd: appDirectory },
  );
  await run(
    'npm',
    [
      'install',
      '--no-audit',
      '--no-fund',
      '--save-dev',
      '--loglevel',
      'error',
      'typescript',
      '@types/node',
      '@types/react',
    ],
    { cwd: appDirectory },
  );

  const build = await timed('Next build', () =>
    run('npm', ['run', 'build'], { cwd: appDirectory }),
  );

  const standalone = path.join(appDirectory, '.next', 'standalone');
  // Next's standalone output expects the static assets to be placed beside it.
  copyDirectory(
    path.join(appDirectory, '.next', 'static'),
    path.join(standalone, '.next', 'static'),
  );

  return {
    name: 'Next.js',
    appDirectory,
    buildMs: build.ms,
    installBytes: directorySize(path.join(appDirectory, 'node_modules')),
    deployBytes: directorySize(standalone),
    clientBytes: directorySize(path.join(appDirectory, '.next', 'static')),
    start: (port: number) =>
      spawn(process.execPath, ['server.js'], {
        cwd: standalone,
        env: { ...process.env, PORT: String(port), HOSTNAME: '127.0.0.1' },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      }),
  };
}

async function measure(target: Target, options: Options): Promise<Measured> {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  log(`starting ${target.name} on ${port}`);

  const cold = await measureColdStart(() => target.start(port), `${base}/`);
  const child = cold.child;
  const routes: RouteResult[] = [];

  try {
    for (const route of ROUTES) {
      const url = `${base}${route.path}`;

      // Guard the comparison itself: if the server answers from a response
      // cache, the run measures a memory read against the other framework's
      // render. Both sides must be rendering for the numbers to mean anything.
      const probe = await fetch(url);
      await probe.arrayBuffer();
      const cacheState = probe.headers.get('x-ness-cache');
      if (cacheState && cacheState !== 'MISS') {
        throw new Error(
          `${target.name} served ${route.path} from its response cache (x-ness-cache: ${cacheState}). ` +
            'The benchmark would be comparing a cache read against a render. Disable the page cache in the fixture.',
        );
      }

      // Warm the route so JIT and lazy module loading do not land in the sample.
      await measureThroughput(url, { duration: 1, connections: 8 });
      const ttfb = await measureTtfb(url);
      const load = await measureThroughput(url, {
        duration: options.duration,
        connections: options.connections,
      });
      log(
        `  ${target.name} ${route.name}: ${load.rps.toFixed(0)} rps, p95 ${load.p95.toFixed(1)}ms`,
      );
      routes.push({ ...route, ttfb, ...load });
    }
  } finally {
    killTree(child);
    await sleep(300);
  }

  return { ...target, coldStartMs: cold.ms, routes };
}

const mb = (bytes: number): string => `${(bytes / 1_048_576).toFixed(1)} MB`;
const kb = (bytes: number): string => `${(bytes / 1024).toFixed(0)} KB`;
const seconds = (ms: number): string => `${(ms / 1000).toFixed(1)} s`;

function renderReport(results: Measured[], options: Options): string {
  const columns = results.map(result => result.name);
  const header = `| Metric | ${columns.join(' | ')} |`;
  const divider = `| --- | ${columns.map(() => '---').join(' | ')} |`;
  const rows: Array<[string, string[]]> = [
    ['Build time', results.map(result => seconds(result.buildMs))],
    [
      'Cold start to first response',
      results.map(result => `${result.coldStartMs.toFixed(0)} ms`),
    ],
    ['Deployable output', results.map(result => mb(result.deployBytes))],
    ['node_modules (dev)', results.map(result => mb(result.installBytes))],
    ['Client assets', results.map(result => kb(result.clientBytes))],
  ];

  for (const [index, route] of ROUTES.entries()) {
    rows.push([
      `${route.name} — req/s`,
      results.map(result => result.routes[index]!.rps.toFixed(0)),
    ]);
    rows.push([
      `${route.name} — TTFB p50`,
      results.map(result => `${result.routes[index]!.ttfb.toFixed(1)} ms`),
    ]);
    rows.push([
      `${route.name} — latency p95`,
      results.map(result => `${result.routes[index]!.p95.toFixed(1)} ms`),
    ]);
  }

  const errors = results.flatMap(result =>
    result.routes
      .filter(route => route.errors > 0)
      .map(
        route =>
          `${result.name} ${route.path}: ${route.errors} failed requests`,
      ),
  );

  return [
    '# Ness.js vs Next.js',
    '',
    `Generated by \`scripts/bench/run.ts\` on ${os.type()} ${os.release()}, ${os.cpus()[0]?.model || 'unknown CPU'}, ${os.cpus().length} cores, Node ${process.version}.`,
    `Load: ${options.connections} concurrent connections for ${options.duration}s per route, both servers self-hosted on Node.`,
    '',
    header,
    divider,
    ...rows.map(([label, values]) => `| ${label} | ${values.join(' | ')} |`),
    '',
    errors.length ? `> Failed requests: ${errors.join('; ')}` : '',
    '',
    'Absolute numbers depend on the machine. Re-run the script rather than quoting these.',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const workdir =
    options.workdir || fs.mkdtempSync(path.join(os.tmpdir(), 'ness-bench-'));
  fs.mkdirSync(workdir, { recursive: true });
  log(`workdir ${workdir}`);

  const results: Measured[] = [];
  try {
    if (options.only.includes('ness')) {
      const tarballs = await packWorkspace(path.join(workdir, 'tarballs'), {
        onPack: name => log(`packed ${name}`),
      });
      results.push(
        await measure(await prepareNess(workdir, tarballs), options),
      );
    }
    if (options.only.includes('next')) {
      results.push(await measure(await prepareNext(workdir), options));
    }
  } finally {
    if (!options.keep) fs.rmSync(workdir, { recursive: true, force: true });
  }

  const report = renderReport(results, options);
  const reportFile = path.join(ROOT, 'scripts', 'bench', 'results.md');
  fs.writeFileSync(reportFile, report);
  console.log(`\n${report}`);
  log(`written to ${path.relative(ROOT, reportFile)}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
