#!/usr/bin/env node
/**
 * Publishes the workspace to npm in dependency order.
 *
 * Order matters: a package is published only after everything it depends on,
 * so there is never a window where a published package resolves a dependency
 * version that does not exist yet.
 *
 * With two-factor authentication enabled, npm handles the authentication
 * itself: it prints a browser URL to approve, or prompts in the terminal,
 * depending on how the account is configured. This script hands npm the real
 * terminal and blocks until that finishes, so there is nothing to pre-supply.
 *
 *   npm run release                       # authenticate when npm asks
 *   npm run release -- --otp=123456       # skip the prompt with a code
 *   npm run release -- --dry-run          # pack and validate, publish nothing
 *   npm run release -- --verify-timeout=600   # wait longer for the registry
 *
 * Already-published versions are reported and skipped rather than failing the
 * run, so an interrupted release can be resumed by running it again.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

/**
 * Dependency tiers. Everything in a tier is independent of everything else in
 * it; each tier depends only on tiers above it.
 */
const TIERS = [
  [
    '@nessframework/cache',
    '@nessframework/components',
    '@nessframework/instrumentation',
    '@nessframework/router',
  ],
  ['@nessframework/server'],
  [
    '@nessframework/assets',
    '@nessframework/deployment',
    '@nessframework/testing',
  ],
  ['@nessframework/core'],
  [
    '@nessframework/analyzer',
    '@nessframework/compression',
    '@nessframework/env',
    '@nessframework/nest',
    '@nessframework/security',
    '@nessframework/tailwind',
    '@nessframework/cli',
  ],
  [
    '@nessframework/default',
    '@nessframework/typescript',
    '@nessframework/minimal',
    '@nessframework/api',
    '@nessframework/dashboard',
  ],
];

/** How long the final check waits for the registry to catch up, in seconds. */
const DEFAULT_VERIFY_TIMEOUT = 300;

interface Options {
  dryRun: boolean;
  verifyTimeout: number;
  otp?: string;
}

function parseArguments(argv: string[]): Options {
  const options: Options = {
    dryRun: false,
    verifyTimeout: DEFAULT_VERIFY_TIMEOUT,
  };
  for (const argument of argv) {
    if (argument === '--dry-run') options.dryRun = true;
    else if (argument.startsWith('--otp='))
      options.otp = argument.slice('--otp='.length);
    else if (argument.startsWith('--verify-timeout=')) {
      const seconds = Number(argument.slice('--verify-timeout='.length));
      if (!Number.isFinite(seconds) || seconds < 0) {
        throw new Error(
          `--verify-timeout takes a number of seconds: ${argument}`,
        );
      }
      options.verifyTimeout = seconds;
    }
  }
  return options;
}

const log = (message: string): void =>
  console.log(`\x1b[36m[release]\x1b[0m ${message}`);

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/** Captures output. Only for non-interactive queries such as `npm view`. */
function capture(
  command: string,
  args: string[],
): Promise<{ code: number | null; output: string }> {
  return new Promise(resolve => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
      output += chunk;
    });
    child.stderr?.setEncoding('utf8').on('data', (chunk: string) => {
      output += chunk;
    });
    child.on('close', code => resolve({ code, output }));
  });
}

/**
 * Hands npm the real terminal and waits for it to exit.
 *
 * This is what makes two-factor authentication work. With piped stdio npm sees
 * no TTY: it cannot print the browser authentication URL, cannot prompt for a
 * one-time password, and cannot wait for either — it just fails. Inheriting the
 * terminal lets npm run whichever flow the account is configured for, and the
 * promise stays pending until the authentication completes.
 */
function interactive(
  command: string,
  args: string[],
): Promise<{ code: number | null }> {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd: ROOT, stdio: 'inherit' });
    child.on('close', code => resolve({ code }));
  });
}

/** Local name → version, from the workspace manifests. */
function workspaceVersions(): Map<string, string> {
  const versions = new Map<string, string>();
  for (const group of ['packages', 'plugins', 'templates']) {
    for (const entry of fs.readdirSync(path.join(ROOT, group), {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(ROOT, group, entry.name, 'package.json');
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
        name: string;
        version: string;
        private?: boolean;
      };
      if (manifest.private) continue;
      versions.set(manifest.name, manifest.version);
    }
  }
  return versions;
}

/**
 * `--prefer-online` is not optional here. npm serves the packument it already
 * has in its cache until that entry goes stale, so straight after a publish the
 * answer can be the version this run just replaced — reported as "not visible
 * on npm" for a package that published perfectly well.
 */
async function publishedVersion(name: string): Promise<string | undefined> {
  const { code, output } = await capture('npm', [
    'view',
    name,
    'version',
    '--prefer-online',
  ]);
  return code === 0 ? output.trim() : undefined;
}

/**
 * Waits for every package to read back at its expected version.
 *
 * A publish is not visible the instant `npm publish` returns: the registry's
 * read replicas trail the write, and how far they trail varies per package.
 * Checking once and failing turned a completely successful release into a red
 * exit — the packages were on npm, the replica serving this machine had simply
 * not caught up. Only the ones still behind are re-checked, and the wait backs
 * off so a slow replica is not hammered.
 *
 * Returns the names that never appeared before the deadline.
 */
async function waitForRegistry(
  expected: Map<string, string>,
  timeoutSeconds: number,
): Promise<string[]> {
  const pending = new Map(expected);
  const deadline = Date.now() + timeoutSeconds * 1000;
  let delay = 2000;

  for (;;) {
    for (const [name, version] of [...pending]) {
      if ((await publishedVersion(name)) === version) pending.delete(name);
    }
    if (!pending.size) return [];
    if (Date.now() >= deadline) return [...pending.keys()];

    const waiting = [...pending.keys()].join(', ');
    log(`  waiting for the registry to catch up: ${waiting}`);
    await sleep(delay);
    delay = Math.min(delay * 2, 15000);
  }
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));

  // npm's authentication prompts need a terminal. Failing here is far better
  // than failing halfway through a release that cannot be undone.
  if (!options.otp && !options.dryRun && !process.stdin.isTTY) {
    throw new Error(
      'No interactive terminal. npm cannot open its browser authentication or prompt for a ' +
        'one-time password here.\nRun this from a terminal, or pass --otp=<code>.',
    );
  }

  const { code: authCode, output: whoami } = await capture('npm', ['whoami']);
  if (authCode !== 0) {
    throw new Error(
      'Not logged in to npm. Run `npm login` first.\n' + whoami.trim(),
    );
  }
  log(`publishing as ${whoami.trim()}`);

  const versions = workspaceVersions();

  const listed = new Set(TIERS.flat());
  const unlisted = [...versions.keys()].filter(name => !listed.has(name));
  if (unlisted.length) {
    throw new Error(
      `These publishable workspaces are missing from the release order: ${unlisted.join(', ')}. ` +
        'Add them to a tier in scripts/release/publish.ts so ordering stays deliberate.',
    );
  }

  const published: string[] = [];
  const skipped: string[] = [];

  for (const [index, tier] of TIERS.entries()) {
    log(`tier ${index + 1}/${TIERS.length}`);
    for (const name of tier) {
      const version = versions.get(name);
      if (!version) throw new Error(`${name} is not a publishable workspace.`);

      const existing = await publishedVersion(name);
      if (existing === version) {
        log(`  ${name}@${version} already on npm, skipping`);
        skipped.push(name);
        continue;
      }

      const { code } = await interactive('npm', [
        'publish',
        '--workspace',
        name,
        '--access',
        'public',
        // Only passed when explicitly supplied. Without it npm runs its own
        // flow — a browser prompt or a terminal one — and this waits for it.
        ...(options.otp ? ['--otp', options.otp] : []),
        ...(options.dryRun ? ['--dry-run'] : []),
      ]);

      if (code !== 0) {
        throw new Error(
          `${name}@${version} failed to publish. Everything already published stays published; ` +
            're-run this script to continue from here.',
        );
      }
      log(`  \x1b[32m${name}@${version}\x1b[0m`);
      published.push(`${name}@${version}`);
    }
  }

  log(`published ${published.length}, skipped ${skipped.length}`);
  if (options.dryRun) return;

  // Confirm the registry agrees, rather than trusting the exit codes.
  log(`verifying the registry (up to ${options.verifyTimeout}s)`);
  const missing = await waitForRegistry(versions, options.verifyTimeout);

  if (missing.length) {
    throw new Error(
      `Still not visible on npm after ${options.verifyTimeout}s: ${missing.join(', ')}\n` +
        'Nothing here needs undoing — every publish above succeeded, and this run ' +
        'skips whatever is already live. Check https://www.npmjs.com/package/' +
        `${missing[0]} , then either re-run this script or wait it out with ` +
        '`npm run release -- --verify-timeout=900`.',
    );
  }
  log('\x1b[32mall packages are live at the expected versions\x1b[0m');
}

main().catch((error: unknown) => {
  console.error(
    `\x1b[31m${error instanceof Error ? error.message : String(error)}\x1b[0m`,
  );
  process.exit(1);
});
