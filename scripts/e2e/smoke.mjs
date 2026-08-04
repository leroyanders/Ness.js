#!/usr/bin/env node
/**
 * End-to-end smoke test for the official templates.
 *
 * For every template this scaffolds a real application with the CLI, replaces
 * the published @nessframework/* packages with tarballs packed from this
 * working tree, builds it, starts the production server, and asserts the app
 * actually answers over HTTP.
 *
 * Packing rather than symlinking is deliberate: `npm pack` honours each
 * package's `files` field, so a file that exists locally but is missing from
 * the published tarball fails here instead of in a user's first install.
 *
 *   node scripts/e2e/smoke.mjs
 *   node scripts/e2e/smoke.mjs --templates default,minimal --keep
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {
  ROOT,
  overrideArguments,
  packWorkspace,
  pinTransitiveDependencies,
  run,
} from '../lib/workspace.mjs';

const TEMPLATES = {
  default: { api: '/api/health' },
  typescript: { api: '/api/health' },
  minimal: { api: '/api/health' },
  api: { api: '/api/health' },
  dashboard: { api: '/api/dashboard/metrics' },
  // The RSC pipeline is a different build entirely, so it needs its own run
  // rather than being assumed to work because the classic one does.
  'typescript-rsc': {
    template: 'typescript',
    api: '/api/health',
    rsc: true,
    // RSC builds do not emit the standalone-compatible server bundle yet.
    standalone: false,
  },
};

const BOOT_TIMEOUT = 90_000;

function parseArguments(argv) {
  const options = { templates: Object.keys(TEMPLATES), keep: false };
  for (const argument of argv) {
    if (argument === '--keep') options.keep = true;
    else if (argument.startsWith('--templates=')) {
      options.templates = argument.slice('--templates='.length).split(',');
    } else if (argument.startsWith('--workdir=')) {
      options.workdir = path.resolve(argument.slice('--workdir='.length));
    }
  }
  const unknown = options.templates.filter(name => !(name in TEMPLATES));
  if (unknown.length) {
    throw new Error(
      `Unknown template(s): ${unknown.join(', ')}. Known: ${Object.keys(TEMPLATES).join(', ')}`,
    );
  }
  return options;
}

function log(message) {
  console.log(`\x1b[36m[e2e]\x1b[0m ${message}`);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Every request is bounded, so a wedged route fails the job instead of hanging it. */
function get(url) {
  return fetch(url, { signal: AbortSignal.timeout(15_000) });
}

/**
 * `ness start` spawns the server as a grandchild, so signalling the direct
 * child leaves the server running and holding the port. Killing the process
 * group takes the whole tree down.
 */
function killTree(child) {
  if (child.exitCode !== null) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}

async function waitForServer(url, child, timeout = BOOT_TIMEOUT) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`The server exited early with code ${child.exitCode}`);
    }
    try {
      const response = await get(url);
      if (response.status < 500) return response;
      lastError = new Error(`Received ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(500);
  }
  throw new Error(`Server did not become ready within ${timeout}ms`, {
    cause: lastError,
  });
}

/**
 * Boots a server and asserts the application answers. Used for both `ness
 * start` and the standalone bundle, because a bundle that builds but cannot
 * render is the failure mode that actually reaches users.
 */
async function assertServer(spawnServer, template, port, label) {
  const base = `http://127.0.0.1:${port}`;
  const child = spawnServer();
  let serverOutput = '';
  child.stdout.setEncoding('utf8').on('data', chunk => {
    serverOutput += chunk;
  });
  child.stderr.setEncoding('utf8').on('data', chunk => {
    serverOutput += chunk;
  });

  try {
    await waitForServer(`${base}/_ness/health`, child);

    const health = await get(`${base}/_ness/health`);
    assert.equal(health.status, 200, 'framework health endpoint');
    assert.equal(
      (await health.json()).healthy,
      true,
      'framework reports healthy',
    );

    const page = await get(base);
    assert.equal(page.status, 200, 'the home page responds');
    assert.match(
      page.headers.get('content-type') || '',
      /text\/html/,
      'the home page is served as HTML',
    );
    const html = await page.text();
    assert.match(html, /<html/i, 'the home page is a rendered document');
    assert.ok(
      !/__vite_error_overlay|Internal Server Error/i.test(html),
      'the home page renders without an error placeholder',
    );

    const apiPath = TEMPLATES[template].api;
    const api = await get(`${base}${apiPath}`);
    assert.equal(
      api.status,
      200,
      `the NestJS route ${apiPath} responds (Nest and Express must agree on a major version)`,
    );
    assert.match(
      api.headers.get('content-type') || '',
      /application\/json/,
      `${apiPath} returns JSON`,
    );

    const missing = await get(`${base}/this-route-does-not-exist`);
    assert.equal(missing.status, 404, 'unknown routes return 404');
  } catch (error) {
    error.message = `[${label}] ${error.message}\n\n--- server output ---\n${serverOutput}`;
    throw error;
  } finally {
    killTree(child);
    await sleep(500);
    if (child.exitCode === null) {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
    }
  }
}

async function verifyTemplate(template, tarballs, workdir) {
  const config = TEMPLATES[template];
  const appDirectory = path.join(workdir, `ness-${template}`);
  log(`scaffolding ${template}`);
  await run(
    process.execPath,
    [
      path.join(ROOT, 'packages', 'cli', 'bin', 'index.js'),
      'new',
      appDirectory,
      '--template',
      path.join(ROOT, 'templates', config.template || template),
      ...(config.rsc ? ['--rsc'] : []),
      ...overrideArguments(tarballs),
    ],
    { cwd: workdir },
  );

  log(`pinning transitive packages for ${template}`);
  pinTransitiveDependencies(appDirectory, tarballs);
  await run(
    'npm',
    ['install', '--no-audit', '--no-fund', '--loglevel', 'error'],
    { cwd: appDirectory },
  );

  log(`building ${template}`);
  await run('npm', ['run', 'build'], { cwd: appDirectory });

  const port = await freePort();
  log(`starting ${template} on port ${port}`);
  await assertServer(
    () =>
      spawn(
        process.execPath,
        [path.join(appDirectory, 'node_modules', '.bin', 'ness'), 'start'],
        {
          cwd: appDirectory,
          env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: true,
        },
      ),
    template,
    port,
    'ness start',
  );

  if (config.standalone === false) {
    log(
      `\x1b[32m${template} passed\x1b[0m (standalone bundling not applicable)`,
    );
    return;
  }

  log(`bundling ${template} for standalone deployment`);
  await run(
    process.execPath,
    [path.join(appDirectory, 'node_modules', '.bin', 'ness'), 'bundle', 'node'],
    { cwd: appDirectory },
  );

  const standalone = path.join(appDirectory, 'build', 'standalone');
  assert.ok(
    fs.existsSync(path.join(standalone, 'server.mjs')),
    'the standalone bundle has a launcher',
  );
  assert.ok(
    !fs.existsSync(path.join(standalone, 'node_modules', 'vite')),
    'build tooling must not be traced into the deployment bundle',
  );

  const standalonePort = await freePort();
  log(`starting the ${template} bundle on port ${standalonePort}`);
  await assertServer(
    () =>
      spawn(process.execPath, ['server.mjs'], {
        cwd: standalone,
        // Deliberately no NODE_ENV: the launcher must set it itself before
        // React is first required.
        env: {
          ...process.env,
          NODE_ENV: undefined,
          PORT: String(standalonePort),
          HOST: '127.0.0.1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      }),
    template,
    standalonePort,
    'standalone bundle',
  );

  log(`\x1b[32m${template} passed\x1b[0m`);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const workdir =
    options.workdir || fs.mkdtempSync(path.join(os.tmpdir(), 'ness-e2e-'));
  fs.mkdirSync(workdir, { recursive: true });
  log(`workdir ${workdir}`);

  const failures = [];
  try {
    const tarballs = await packWorkspace(path.join(workdir, 'tarballs'), {
      onPack: (name, files) => log(`packed ${name} (${files} files)`),
    });
    for (const template of options.templates) {
      try {
        await verifyTemplate(template, tarballs, workdir);
      } catch (error) {
        failures.push({ template, error });
        console.error(
          `\x1b[31m[e2e] ${template} failed\x1b[0m\n${error.message}`,
        );
      }
    }
  } finally {
    if (!options.keep) fs.rmSync(workdir, { recursive: true, force: true });
    else log(`kept ${workdir}`);
  }

  if (failures.length) {
    console.error(
      `\n\x1b[31m${failures.length} of ${options.templates.length} template(s) failed: ${failures
        .map(failure => failure.template)
        .join(', ')}\x1b[0m`,
    );
    process.exit(1);
  }
  log(`\x1b[32mall ${options.templates.length} template(s) passed\x1b[0m`);
  // fetch() leaves keep-alive sockets in undici's pool, which keeps the event
  // loop alive; without this the run hangs after the last assertion passes.
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
