#!/usr/bin/env node
process.env.NODE_ENV = 'production';
process.on('unhandledRejection', error => {
  throw error;
});

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'fs-extra';
import FileSizeReporter from 'react-dev-utils/FileSizeReporter.js';
import formatWebpackMessages from 'react-dev-utils/formatWebpackMessages.js';
import webpack from 'webpack';
import createConfig from '../config/config.js';
import paths from '../config/paths.js';
import * as colors from '../utils/colors.js';

async function loadConfiguration() {
  if (!fs.existsSync(paths.nessConfig)) return {};
  const loaded = await import(pathToFileURL(paths.nessConfig).href);
  return loaded.default || loaded;
}

function compile(config) {
  return new Promise((resolve, reject) => {
    let compiler;
    try {
      compiler = webpack(config);
    } catch (error) {
      reject(error);
      return;
    }

    compiler.run((error, stats) => {
      compiler.close(closeError => {
        if (error || closeError) {
          reject(error || closeError);
          return;
        }
        const messages = formatWebpackMessages(
          stats.toJson({ all: false, errors: true, warnings: true }),
        );
        if (messages.errors.length) {
          reject(new Error(messages.errors.join('\n\n')));
          return;
        }
        resolve({ stats, warnings: messages.warnings });
      });
    });
  });
}

function typecheck() {
  if (!fs.existsSync(paths.appTsConfig)) return;
  const typescriptDirectory = [paths.nodeModulesDirectory, paths.ownNodeModules]
    .map(directory => path.join(directory, 'typescript'))
    .find(directory => fs.existsSync(path.join(directory, 'package.json')));
  if (!typescriptDirectory) throw new Error('Unable to find TypeScript.');
  const result = spawnSync(
    process.execPath,
    [
      path.join(typescriptDirectory, 'bin/tsc'),
      '--project',
      paths.appTsConfig,
      '--noEmit',
    ],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('TypeScript type-check failed.');
}

async function build() {
  typecheck();
  const previousFileSizes = await FileSizeReporter.measureFileSizesBeforeBuild(
    paths.appdeployPublic,
  );
  fs.emptyDirSync(paths.appdeploy);
  if (fs.existsSync(paths.publicDirectory)) {
    fs.copySync(paths.publicDirectory, paths.appdeployPublic, {
      dereference: true,
    });
  }

  const ness = await loadConfiguration();
  console.log('Creating an optimized production build...\n');
  console.log('Compiling client...');
  const client = await compile(await createConfig('web', 'prod', ness));
  console.log(colors.green('Compiled client successfully.\n'));

  console.log('Compiling server...');
  const server = await compile(await createConfig('node', 'prod', ness));
  console.log(colors.green('Compiled server successfully.\n'));

  const warnings = [...client.warnings, ...server.warnings];
  console.log(
    warnings.length
      ? colors.yellow(`Compiled with ${warnings.length} warning(s).\n`)
      : colors.green('Application compiled successfully.\n'),
  );
  if (warnings.length) console.log(`${warnings.join('\n\n')}\n`);
  FileSizeReporter.printFileSizesAfterBuild(
    client.stats,
    previousFileSizes,
    paths.appdeployPublic,
  );
}

build().catch(error => {
  console.error(colors.red('Failed to compile.\n'));
  console.error(`${error.message || error}\n`);
  process.exit(1);
});
