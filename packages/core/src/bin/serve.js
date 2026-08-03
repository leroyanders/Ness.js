#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequestListener } from '@remix-run/node-fetch-server';
import { createImageHandler } from '@nessframework/assets/image/server';
import { getCache, setCache } from '@nessframework/cache';
import { registerInstrumentation } from '@nessframework/instrumentation';
import { createNessRequestHandler } from '@nessframework/server';
import express from 'express';

async function loadServerConfig(root) {
  const filename = [
    'ness.config.mjs',
    'ness.config.js',
    'ness.server.config.mjs',
    'ness.server.config.js',
  ]
    .map(candidate => path.join(root, candidate))
    .find(fs.existsSync);
  if (!filename) return {};
  const module = await import(
    `${pathToFileURL(filename).href}?t=${fs.statSync(filename).mtimeMs}`
  );
  const config = module.default || module;
  return config.ness
    ? {
        config: config.ness.server || {},
        instrumentation: config.ness.instrumentation,
      }
    : { config, instrumentation: undefined };
}

async function loadInstrumentation(root, configuredInstrumentation) {
  if (configuredInstrumentation) {
    registerInstrumentation(configuredInstrumentation);
    return;
  }
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
  const loadedConfig = await loadServerConfig(root);
  const config = loadedConfig.config || {};
  const { configureServer, ...handlerConfig } = config;
  await loadInstrumentation(root, loadedConfig.instrumentation);
  if (config.cache) setCache(config.cache);
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
  app.use(
    '/assets',
    express.static(path.join(clientDirectory, 'assets'), {
      immutable: true,
      maxAge: '1y',
    }),
  );
  app.use(express.static(clientDirectory, { index: false, maxAge: '1h' }));
  app.use(express.static(path.join(root, 'public'), { maxAge: '1h' }));
  app.get('/_ness/health', async (_request, response) => {
    const cache = getCache();
    response.set('cache-control', 'no-store').json({
      healthy: true,
      framework: 'Ness.js',
      cache: cache.constructor.name,
    });
  });
  const disposeConfiguredServer = configureServer
    ? await configureServer(app, { root, build, handler })
    : undefined;
  app.use(createRequestListener(handler));
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const server = app.listen(port, host, error => {
    if (error) throw error;
    console.log(
      `[ness] http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
    );
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, async () => {
      await disposeConfiguredServer?.();
      server.close(() => process.exit(0));
    });
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
