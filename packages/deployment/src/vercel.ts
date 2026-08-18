import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import type { Dirent } from 'node:fs';
import { readManifest, traceDependencies } from './trace.js';
import type { ServerBuildLike } from '@nessframework/server';

export interface VercelHandlerOptions {
  /** The server build: `import * as build from './build/server/index.js'`. */
  build?: unknown;
  /** A runtime-only config module, applied on the first request. */
  config?: unknown;
  /** Directory containing `build/`. Defaults to `process.cwd()`. */
  root?: string;
  [option: string]: unknown;
}

export interface VercelOutputOptions {
  /** Application root. Defaults to the working directory. */
  root?: string;
  /** Build output directory. Defaults to `build`. */
  buildDirectory?: string;
  /** Where to write the Build Output API tree. Defaults to `.vercel/output`. */
  outputDirectory?: string;
  /**
   * Runtime-only config file to bundle into the entry, relative to root.
   * Auto-detected if omitted.
   */
  configPath?: string;
  /** `.vc-config.json` `runtime` value. Defaults to `nodejs22.x`. */
  runtime?: string;
  /** Packages to trace even though nothing declares them (runtime requires). */
  extraPackages?: string[];
  logger?: Pick<Console, 'log' | 'warn'> | null;
}

export interface VercelOutputReport {
  /** The `.vercel/output` directory. */
  output: string;
  /** The `.vercel/output/functions/index.func` directory. */
  function: string;
  packages: number;
  /** Declared dependencies that were not present on disk and were skipped. */
  missing: string[];
  /** Size in bytes of the function directory. */
  bytes: number;
}

type UpgradeHandler = (
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
) => void;

/**
 * Registered by a plugin's `configureServer` (the Nest one, via `ws-hub`).
 * Looked up per upgrade rather than captured, since it only exists once
 * `configureServer` has run. Read through a cast rather than an ambient `var`
 * so two packages doing the same thing cannot collide on one declaration.
 */
function webSocketUpgrade(): UpgradeHandler | undefined {
  return (globalThis as { __nessWebSocketUpgrade?: UpgradeHandler })
    .__nessWebSocketUpgrade;
}

/** An express application, described only where this file reaches into it. */
interface ExpressLike {
  (request: IncomingMessage, response: ServerResponse): void;
  disable(setting: string): void;
  use(handler: unknown): void;
}

type CopyFilter = (from: string, entry: Dirent) => boolean;

/**
 * Builds a raw `http.Server` around a Ness server build, for Vercel's
 * Node.js Function runtime.
 *
 * Unlike `createLambdaApplication`/`createWorkerHandler`, this composes
 * `configureServer` — the same hook `packages/core/src/bin/serve.js` calls —
 * so a plugin like `@nessframework/nest` gets to mount its own middleware
 * (an Express sub-app) ahead of the SSR fallback. Vercel's Node runtime is a
 * real Node process, unlike Cloudflare Workers' isolate, so there is nowhere
 * near the same pressure to avoid Express; and unlike raw Lambda, there is
 * no API-Gateway-shaped event to convert from.
 *
 * The export is an `http.Server`, not a plain `(req, res)` function, because
 * that is what Vercel's own WebSocket support requires (see
 * https://vercel.com/docs/functions/websockets): a connection upgrade only
 * ever reaches a Function that owns a real server instance to attach
 * `'upgrade'` to. The bridge below matches `serve.js`'s own contract exactly
 * — a plugin (the Nest one, via `ws-hub.ts`) registers
 * `globalThis.__nessWebSocketUpgrade`, looked up fresh on every upgrade
 * rather than captured once, since it is only set once `configureServer`
 * has actually run. WebSocket support additionally requires Fluid compute
 * to be enabled on the Vercel project (default for projects created after
 * 2025-04-23; older projects must turn it on in Project Settings).
 *
 * Imports inside `prepare()` are lazy, matching `createLambdaApplication`:
 * a cold start is metered, and a Function that never actually gets a request
 * (rare, but happens during a deploy's health check) should not pay for
 * `express`, the cache adapter, or instrumentation setup at all. The
 * `http.Server` itself is cheap to construct, so it is created eagerly —
 * only the work behind the first request or upgrade is deferred.
 */
function createVercelHandler({
  build,
  config,
  root,
  ...handlerOptions
}: VercelHandlerOptions = {}): Server {
  if (!build) {
    throw new TypeError(
      'createVercelHandler requires the server build: import * as build from "./build/server/index.js".',
    );
  }
  const resolvedRoot = root || process.cwd();

  let ready:
    Promise<{ app: ExpressLike; disposeConfiguredServer: unknown }> | undefined;
  const prepare = async () => {
    const { createNessRequestHandler } = await import('@nessframework/server');
    const { applyForwardedHeaders } =
      await import('@nessframework/server/proxy');
    const { compressResponse } = await import('@nessframework/server/compress');
    const { applyRuntimeConfig } =
      await import('@nessframework/server/runtime');
    const { createImageHandler } =
      await import('@nessframework/assets/image/server');
    const { createRequestListener } =
      await import('@remix-run/node-fetch-server');
    const { default: express } = await import('express');

    const { server, options } = await applyRuntimeConfig(config);
    const images = server['images'];
    // `typeof null === 'object'`, so a configured `images: null` used to reach
    // createImageHandler as null and throw on destructuring rather than fall
    // back to the defaults the `= {}` parameter promises.
    const imageHandler =
      images === false
        ? undefined
        : createImageHandler(
            images && typeof images === 'object' ? images : {},
          );
    const handler = createNessRequestHandler({
      build: build as ServerBuildLike,
      imageHandler,
      ...options,
      ...handlerOptions,
    });

    const app = express() as unknown as ExpressLike;
    app.disable('x-powered-by');

    // The Nest (or any other plugin's) middleware, mounted ahead of the SSR
    // fallback — same contract, same order, as `serve.js`.
    const configureServer = server['configureServer'] as
      | ((
          app: ExpressLike,
          context: { root: string; build: unknown; handler: unknown },
        ) => unknown)
      | undefined;
    const disposeConfiguredServer = configureServer
      ? await configureServer(app, {
          root: resolvedRoot,
          build,
          handler,
        })
      : undefined;

    const compression = server['compression'];
    const compressionOptions =
      compression && typeof compression === 'object' ? compression : {};
    const respond = async (incoming: Request): Promise<Response> => {
      const request = applyForwardedHeaders(incoming, {
        // Vercel terminates TLS and forwards the original scheme, same as
        // API Gateway in front of Lambda.
        trustProxy: server['trustProxy'] === true,
      });
      const response = await handler(request);
      return compression === false
        ? response
        : compressResponse(request, response, compressionOptions);
    };
    app.use(createRequestListener(respond));

    return { app, disposeConfiguredServer };
  };

  const httpServer = createServer((request, response) => {
    ready ??= prepare();
    ready
      .then(({ app }) => app(request, response))
      .catch((error: unknown) => {
        console.error(error);
        if (!response.headersSent) response.writeHead(500);
        response.end('Internal Server Error');
      });
  });

  // A connection upgrade can be the very first thing a cold instance sees
  // (the dashboard opens its WebSocket on mount, independent of any
  // ordinary request), so this also waits on `prepare()` — otherwise
  // `configureServer` may not have run yet and `__nessWebSocketUpgrade`
  // would not be registered even though the app is fully able to serve it.
  httpServer.on('upgrade', (request, socket, head) => {
    (ready ??= prepare())
      .then(() => {
        const handle = webSocketUpgrade();
        if (typeof handle === 'function') handle(request, socket, head);
        else socket.destroy();
      })
      .catch(() => socket.destroy());
  });

  return httpServer;
}

const VERCEL_ENTRY = `// Generated by Ness.js. Edit ness.server.config.mjs instead.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as build from './build/server/index.js';
import { createVercelHandler } from '@nessframework/deployment/vercel';

const root = path.dirname(fileURLToPath(import.meta.url));

export default createVercelHandler({ build, root });
`;

/**
 * The generated Vercel Function entry, with the runtime config bundled in
 * when there is one — same reasoning as `workerEntry`: `ness.config.mjs`
 * imports Vite plugins at module scope, which a deployed function cannot
 * carry, so a runtime-only config file is imported instead when present.
 *
 * The config is a namespace import (`import * as config`), not a default
 * import: `serverConfig()` (`@nessframework/server/runtime`) is written to
 * accept either shape (`config?.default ?? config`, falling back to the
 * whole module when there is no default export) — but that fallback only
 * runs if the import itself succeeds. A runtime config file that only has
 * named exports (`export const server = ...`, matching this project's own
 * convention, and `serve.js`'s own loader, which tries `module.default`
 * before falling back to `module`) has no default export at all, so
 * `import config from '...'` fails to *link* — a SyntaxError before
 * `serverConfig`'s leniency ever gets a chance to run.
 */
function vercelEntry({
  configPath,
}: { configPath?: string | undefined } = {}): string {
  if (!configPath) return VERCEL_ENTRY;
  return `// Generated by Ness.js. Edit ${configPath.split('/').pop()} instead.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as build from './build/server/index.js';
import * as config from '${configPath}';
import { createVercelHandler } from '@nessframework/deployment/vercel';

const root = path.dirname(fileURLToPath(import.meta.url));

export default createVercelHandler({ build, root, config });
`;
}

function copyDirectory(
  source: string,
  destination: string,
  { filter }: { filter?: CopyFilter } = {},
): void {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (filter && !filter(from, entry)) continue;
    if (entry.isDirectory()) {
      copyDirectory(from, to, { filter });
    } else if (entry.isSymbolicLink()) {
      // Same reasoning as `standalone.ts`: recreating the link verbatim
      // leaves it dangling once its target is outside the copied tree,
      // which is the normal case for a pnpm-style node_modules.
      const resolved = (() => {
        try {
          return fs.statSync(from);
        } catch {
          return undefined;
        }
      })();
      if (!resolved) continue;
      if (resolved.isDirectory())
        copyDirectory(fs.realpathSync(from), to, { filter });
      else fs.copyFileSync(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function directorySize(directory: string): number {
  let total = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) total += directorySize(target);
    else if (entry.isFile()) {
      try {
        total += fs.statSync(target).size;
      } catch {
        // A file can vanish between the listing and the stat; size is a
        // report, not a correctness signal.
      }
    }
  }
  return total;
}

const SKIPPED_PACKAGE_ENTRIES = new Set([
  '.bin',
  '.github',
  '__tests__',
  'test',
  'tests',
  'example',
  'examples',
  'docs',
  'coverage',
  'CHANGELOG.md',
]);

/**
 * Emits a Vercel Build Output API v3 deployment: a Node.js Function directory
 * (`.vercel/output/functions/index.func`) with a traced production
 * `node_modules`, the server and (optional) Nest build output, and a
 * generated entry point; the client build as static files
 * (`.vercel/output/static`); and routing config that serves a static file
 * when one matches and falls through to the function otherwise.
 *
 * This exists instead of relying on `vercel.json`'s `functions.*.includeFiles`
 * plus Vercel's own dependency tracer (`@vercel/nft`) because that tracer
 * walks the *JS import graph* from the function's entry file — and
 * `nestServer()` loads `build/nest/app.module.js` through a runtime-computed
 * path (it has to: it is generic across every Ness.js app), which no static
 * analysis can follow. Every package reachable only through the Nest app
 * graph — not also imported by the entry file itself — was invisible to it,
 * one crash per deploy as each code path was hit for the first time.
 * `traceDependencies` walks `package.json` manifests instead of JS imports,
 * so it is unaffected by how anything actually gets loaded at runtime: a
 * declared `dependencies` entry ships, full stop. And because this writes
 * `.vercel/output` directly, Vercel does no tracing or size-limiting glob
 * matching of its own — there is nothing to hit a schema length limit on.
 */
async function createVercelOutput({
  root = process.cwd(),
  buildDirectory = 'build',
  outputDirectory = '.vercel/output',
  configPath,
  runtime = 'nodejs22.x',
  extraPackages = [],
  logger = console,
}: VercelOutputOptions = {}): Promise<VercelOutputReport> {
  const absoluteRoot = path.resolve(root);
  const absoluteBuild = path.resolve(absoluteRoot, buildDirectory);
  const output = path.resolve(absoluteRoot, outputDirectory);

  const serverEntry = path.join(absoluteBuild, 'server', 'index.js');
  if (!fs.existsSync(serverEntry)) {
    throw new Error(
      `No server build at ${serverEntry}. Run \`ness build\` before bundling.`,
    );
  }

  const manifest = readManifest(absoluteRoot);
  if (!manifest) throw new Error(`No package.json found in ${absoluteRoot}`);

  fs.rmSync(output, { recursive: true, force: true });

  const functionDirectory = path.join(output, 'functions', 'index.func');
  const functionBuildDirectory = path.join(functionDirectory, 'build');
  fs.mkdirSync(functionBuildDirectory, { recursive: true });

  copyDirectory(
    path.join(absoluteBuild, 'server'),
    path.join(functionBuildDirectory, 'server'),
  );

  const nestBuild = path.join(absoluteBuild, 'nest');
  if (fs.existsSync(nestBuild)) {
    copyDirectory(nestBuild, path.join(functionBuildDirectory, 'nest'));
  }

  const resolvedConfigPath =
    configPath ||
    [
      'ness.server.config.ts',
      'ness.server.config.mjs',
      'ness.server.config.js',
    ].find(candidate => fs.existsSync(path.join(absoluteRoot, candidate)));
  if (resolvedConfigPath) {
    fs.copyFileSync(
      path.join(absoluteRoot, resolvedConfigPath),
      path.join(functionDirectory, resolvedConfigPath),
    );
  }

  fs.writeFileSync(
    path.join(functionDirectory, 'index.js'),
    vercelEntry({
      configPath: resolvedConfigPath ? `./${resolvedConfigPath}` : undefined,
    }),
  );
  // The pages' own segment config, aggregated onto the one function this
  // output ships: the longest `maxDuration` any page declared, and the union
  // of every `preferredRegion`. Per-page granularity would need per-page
  // functions; until then the function is provisioned for its slowest page.
  const segmentFunctionConfig = (() => {
    try {
      const nessManifest = JSON.parse(
        fs.readFileSync(
          path.join(absoluteBuild, 'ness-manifest.json'),
          'utf8',
        ),
      ) as {
        pages?: Array<{
          config?: {
            maxDuration?: number;
            preferredRegion?: string | string[];
          };
        }>;
      };
      const durations = (nessManifest.pages ?? [])
        .map(page => page.config?.maxDuration)
        .filter((value): value is number => typeof value === 'number');
      const regions = [
        ...new Set(
          (nessManifest.pages ?? []).flatMap(page =>
            page.config?.preferredRegion == null
              ? []
              : [page.config.preferredRegion].flat(),
          ),
        ),
      ];
      return {
        ...(durations.length ? { maxDuration: Math.max(...durations) } : {}),
        ...(regions.length ? { regions } : {}),
      };
    } catch {
      return {};
    }
  })();
  fs.writeFileSync(
    path.join(functionDirectory, '.vc-config.json'),
    `${JSON.stringify(
      {
        runtime,
        handler: 'index.js',
        launcherType: 'Nodejs',
        ...segmentFunctionConfig,
      },
      null,
      2,
    )}\n`,
  );
  // Without this, Node has no package.json above `index.js` inside the
  // deployed function root (/var/task) to learn its module system from, and
  // falls back to CommonJS — which chokes on the entry's own `import`
  // statements before anything of ours ever runs. Same reason
  // `createStandaloneOutput` writes one of its own.
  fs.writeFileSync(
    path.join(functionDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: `${manifest.name || 'ness-app'}-vercel`,
        private: true,
        type: 'module',
      },
      null,
      2,
    )}\n`,
  );

  const { packages, conflicts, missing } = traceDependencies(absoluteRoot, {
    manifest,
    extra: extraPackages,
  });

  const modulesDirectory = path.join(functionDirectory, 'node_modules');
  const packageFilter: CopyFilter = (_from, entry) =>
    !SKIPPED_PACKAGE_ENTRIES.has(entry.name) && entry.name !== 'node_modules';

  for (const [name, directory] of packages) {
    copyDirectory(directory, path.join(modulesDirectory, name), {
      filter: packageFilter,
    });
  }
  // `requiredBy` may itself be a nested destination (e.g.
  // `multer/node_modules/type-is`, when the package doing the requiring is
  // itself a conflict, not a top-level winner) — only its own top-level
  // ancestor needs to actually exist for the nesting to be valid.
  for (const { name, directory, requiredBy } of conflicts) {
    const topLevelAncestor = requiredBy.split('/node_modules/')[0]!;
    if (!packages.has(topLevelAncestor)) continue;
    copyDirectory(
      directory,
      path.join(modulesDirectory, requiredBy, 'node_modules', name),
      { filter: packageFilter },
    );
  }

  const clientBuild = path.join(absoluteBuild, 'client');
  if (fs.existsSync(clientBuild)) {
    copyDirectory(clientBuild, path.join(output, 'static'));
  }

  fs.writeFileSync(
    path.join(output, 'config.json'),
    `${JSON.stringify(
      {
        version: 3,
        routes: [{ handle: 'filesystem' }, { src: '/(.*)', dest: '/index' }],
      },
      null,
      2,
    )}\n`,
  );

  const size = directorySize(functionDirectory);
  const report: VercelOutputReport = {
    output,
    function: functionDirectory,
    packages: packages.size,
    missing,
    bytes: size,
  };

  logger?.log?.(
    `Vercel Build Output: ${output}\n  ${packages.size} packages, ${(size / 1_048_576).toFixed(1)} MB (function)`,
  );
  if (missing.length) {
    logger?.warn?.(
      `  ${missing.length} dependency/dependencies could not be resolved and were skipped: ${missing.join(', ')}`,
    );
  }
  return report;
}

export { createVercelHandler, createVercelOutput, VERCEL_ENTRY, vercelEntry };
export default createVercelHandler;
