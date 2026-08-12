#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequestListener } from '@remix-run/node-fetch-server';
import { createImageHandler } from '@nessframework/assets/image/server';
import { getCache } from '@nessframework/cache';
import { gracefulShutdown } from '@nessframework/deployment';
import * as instrumentation from '@nessframework/instrumentation';
import { registerInstrumentation } from '@nessframework/instrumentation';
import { createNessRequestHandler } from '@nessframework/server';
import {
  compressResponse,
  negotiateEncoding,
} from '@nessframework/server/compress';
import { applyForwardedHeaders } from '@nessframework/server/proxy';
import {
  applyRuntimeConfig,
  serverConfig,
} from '@nessframework/server/runtime';
import express from 'express';
import mime from 'mime-types';

/**
 * Serves the `.br`/`.gz` the compression plugin already emitted next to each
 * asset, when the client will take them.
 *
 * The rewrite has to carry the original `Content-Type` across. Left to itself,
 * `express.static` reads the `.br` extension and labels a stylesheet
 * `application/x-brotli`, which the browser will not parse. `Content-Encoding`
 * says what to unwrap, and `Vary` keeps a shared cache from handing compressed
 * bytes to a client that cannot read them.
 */
function precompressed(directory) {
  const suffixes = { br: '.br', gzip: '.gz' };
  const root = path.resolve(directory);

  return (request, response, next) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return next();

    const encoding = negotiateEncoding(request.headers['accept-encoding']);
    if (!encoding) return next();

    const [pathname] = request.url.split('?');
    const candidate = path.resolve(root, `.${pathname}${suffixes[encoding]}`);
    // `path.resolve` normalises `..`, so a traversal attempt lands outside the
    // root and is refused here rather than reaching the filesystem.
    if (!candidate.startsWith(`${root}${path.sep}`)) return next();
    if (!fs.existsSync(candidate)) return next();

    const type = mime.lookup(pathname);
    if (type)
      response.setHeader('Content-Type', mime.contentType(type) || type);
    response.setHeader('Content-Encoding', encoding);
    response.vary('Accept-Encoding');
    request.url = `${pathname}${suffixes[encoding]}`;
    next();
  };
}

/**
 * Loads the config module, without interpreting it.
 *
 * Normalising here as well as in `applyRuntimeConfig` double-unwrapped a
 * runtime-only file: `{ server, instrumentation }` has no `ness` key, so it was
 * passed on whole as the server section and every setting inside came back
 * undefined — while the Worker, which hands the module straight over, read them
 * correctly. Two targets disagreeing about the file shape is exactly what the
 * shared resolver exists to prevent, so shape is now its business alone.
 *
 * Only the first file that exists is read. Nothing merges them.
 */
async function loadServerConfig(root) {
  const filename = [
    'ness.config.mjs',
    'ness.config.js',
    'ness.server.config.mjs',
    'ness.server.config.js',
  ]
    .map(candidate => path.join(root, candidate))
    .find(fs.existsSync);
  if (!filename) return undefined;
  const module = await import(
    `${pathToFileURL(filename).href}?t=${fs.statSync(filename).mtimeMs}`
  );
  return module.default || module;
}

/** The optional `instrumentation.mjs` beside the project, when the config named none. */
async function loadInstrumentation(root) {
  const filename = ['instrumentation.mjs', 'instrumentation.js']
    .map(candidate => path.join(root, candidate))
    .find(fs.existsSync);
  if (!filename) return;
  const module = await import(
    `${pathToFileURL(filename).href}?t=${fs.statSync(filename).mtimeMs}`
  );
  registerInstrumentation(module.default || module);
}

async function main() {
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  const root = process.cwd();
  const buildFile = path.resolve(
    root,
    process.argv[2] || 'build/server/index.js',
  );
  if (!fs.existsSync(buildFile))
    throw new Error(`Ness server build not found: ${buildFile}`);
  const build = await import(pathToFileURL(buildFile).href);
  const configModule = await loadServerConfig(root);
  // The same resolution every target uses, so `ness start`, a Worker and a
  // Lambda cannot end up honouring different halves of the config.
  const { server: config, options: handlerConfig } =
    await applyRuntimeConfig(configModule);
  const { configureServer } = config;
  // Only when the config named nothing: a file on disk still wins over none.
  if (!serverConfig(configModule).instrumentation)
    await loadInstrumentation(root);
  const imageHandler =
    config.images === false
      ? undefined
      : createImageHandler(
          typeof config.images === 'object' ? config.images : {},
        );
  const handler = createNessRequestHandler({
    build,
    imageHandler,
    ...handlerConfig,
  });
  const app = express();
  app.disable('x-powered-by');
  const clientDirectory = path.join(root, 'build', 'client');
  const publicDirectory = path.join(root, 'public');
  // Ahead of every static mount: a hit here rewrites the URL to the
  // precompressed twin, which the mounts below then serve as an ordinary file.
  if (config.compression !== false) {
    app.use(precompressed(clientDirectory));
    app.use(precompressed(publicDirectory));
  }
  app.use(
    '/assets',
    express.static(path.join(clientDirectory, 'assets'), {
      immutable: true,
      maxAge: '1y',
    }),
  );
  app.use(express.static(clientDirectory, { index: false, maxAge: '1h' }));
  app.use(express.static(publicDirectory, { maxAge: '1h' }));
  // Flipped the moment a shutdown signal arrives, so readiness fails while
  // in-flight requests are still being served.
  let draining = false;

  app.get('/_ness/health', async (_request, response) => {
    const cache = getCache();
    response
      .status(draining ? 503 : 200)
      .set('cache-control', 'no-store')
      .json({
        healthy: !draining,
        status: draining ? 'draining' : 'ready',
        framework: 'Ness.js',
        cache: (cache.adapter ?? cache).constructor.name,
      });
  });
  const disposeConfiguredServer = configureServer
    ? await configureServer(app, { root, build, handler })
    : undefined;
  // Both of these wrap the handler rather than sitting in front of it as
  // middleware, so they work on the `Request` and `Response` the framework
  // itself sees: the forwarded scheme reaches every loader through
  // `request.url`, and the streamed body stays streamed on the way out.
  //
  // Order matters. The scheme is corrected before the request is handled, so
  // redirects and generated links are built from it; compression happens after,
  // on whatever came back.
  const compressionOptions =
    typeof config.compression === 'object' ? config.compression : {};

  const respond = async incoming => {
    const request = applyForwardedHeaders(incoming, {
      trustProxy: config.trustProxy === true,
    });
    const response = await handler(request);
    return config.compression === false
      ? response
      : compressResponse(request, response, compressionOptions);
  };

  app.use(createRequestListener(respond));
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const server = app.listen(port, host, error => {
    if (error) throw error;
    console.log(
      `[ness] http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
    );
  });
  // WebSocket bridge — same contract as the dev server (plugins/nest): the
  // application registers `globalThis.__nessWebSocketUpgrade` and matches
  // only its own paths.
  server.on('upgrade', (request, socket, head) => {
    const handle = globalThis.__nessWebSocketUpgrade;
    if (typeof handle === 'function') handle(request, socket, head);
  });
  gracefulShutdown(server, {
    timeout:
      Number(process.env.NESS_SHUTDOWN_TIMEOUT) ||
      config.shutdownTimeout ||
      10_000,
    onDraining() {
      draining = true;
      console.log('[ness] draining, readiness now reports 503');
    },
    // After the drain: the API layer is still serving the requests being
    // waited for until then.
    onShutdown: () => disposeConfiguredServer?.(),
  });

  // A rejection nobody handled would otherwise take the process down with no
  // explanation, or — worse on older defaults — be swallowed and leave the pod
  // running in a state nobody can account for.
  process.on('unhandledRejection', error => {
    console.error('[ness] unhandled rejection', error);
    instrumentation
      .emit('onError', { error, source: 'process' })
      .catch(() => {});
  });
  process.on('uncaughtException', error => {
    console.error('[ness] uncaught exception', error);
    instrumentation
      .emit('onError', { error, source: 'process' })
      .catch(() => {})
      .finally(() => process.exit(1));
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
