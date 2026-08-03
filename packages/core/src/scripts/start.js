#!/usr/bin/env node
process.env.NODE_ENV = 'development';

import { pathToFileURL } from 'node:url';
import fs from 'fs-extra';
import webpack from 'webpack';
import createConfig from '../config/config.js';
import paths from '../config/paths.js';
import WebpackDevServer from '../config/server.js';
import logger from '../utils/logger.js';
import setPorts from '../utils/ports.js';
import printErrors from '../utils/printErrors.js';

function createCompiler(config) {
  try {
    return webpack(config);
  } catch (error) {
    printErrors('Failed to create the compiler.', [error], false);
    process.exit(1);
  }
}

async function loadConfiguration() {
  if (!fs.existsSync(paths.nessConfig)) return {};
  try {
    const loaded = await import(pathToFileURL(paths.nessConfig).href);
    return loaded.default || loaded;
  } catch (error) {
    logger.error('Invalid ness.config.js file.', error);
    process.exit(1);
  }
}

async function main() {
  const ness = await loadConfiguration();
  fs.removeSync(paths.assets);
  fs.removeSync(paths.chunks);

  const serverCompiler = createCompiler(
    await createConfig('node', 'dev', ness),
  );
  const clientConfig = await createConfig('web', 'dev', ness);
  const clientCompiler = createCompiler(clientConfig);
  let serverWatcher;

  clientCompiler.hooks.done.tap('NessServerCompiler', () => {
    if (!serverWatcher) {
      serverWatcher = serverCompiler.watch({ aggregateTimeout: 200 }, error => {
        if (error) logger.error('Server compilation failed.', error);
      });
    }
  });

  const developmentServer = new WebpackDevServer(
    clientConfig.devServer,
    clientCompiler,
  );
  await developmentServer.start();

  const shutdown = async () => {
    if (serverWatcher)
      await new Promise(resolve => serverWatcher.close(resolve));
    await developmentServer.stop();
  };
  process.once('SIGINT', () => shutdown().finally(() => process.exit(0)));
  process.once('SIGTERM', () => shutdown().finally(() => process.exit(0)));
}

setPorts()
  .then(main)
  .catch(error => {
    logger.error('Unable to start Ness.js.', error);
    process.exit(1);
  });
