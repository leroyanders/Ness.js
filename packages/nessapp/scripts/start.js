#! /usr/bin/env node
process.env.NODE_ENV = 'development';

var createConfig = require('../config/config');
var devServer = require('../config/server');
var fs = require('fs-extra');
var webpack = require('webpack');
var paths = require('../config/paths');
var printErrors = require('../utils/printErrors');
var clearConsole = require('react-dev-utils/clearConsole');
var logger = require('../utils/logger');
var setPorts = require('../utils/ports');

function compile(config) {
  var compiler;

  try { compiler = webpack(config) } catch (e) {
    printErrors('Failed to compile.', [e], false);
    process.exit(1);
  }

  return compiler;
}

function main() {
  var ness = {};

  if (fs.existsSync(paths.nessConfig)) {
    try {
      ness = require(paths.nessConfig);
    } catch (e) {
      clearConsole();
      logger.error('Invalid ness.config.js file.', e);
      process.exit(1);
    }
  }

  fs.removeSync(paths.assets);
  fs.removeSync(paths.chunks);

  var serverConfig = createConfig('node', 'dev', ness, webpack);
  var serverCompiler = compile(serverConfig);
  var clientConfig = createConfig('web', 'dev', ness, webpack);
  var clientCompiler = compile(clientConfig);
  var port = ness.port || clientConfig.devServer.port;
  var watching;

  clientCompiler.hooks.done.tap('BuildStatsPlugin', (stats) => {
    if (watching) return;
    if (serverCompiler) watching = serverCompiler.watch({
      quiet: true,
      stats: 'none'
    }, stats = stats => {});
  });

  var clientDevServer = new devServer(clientCompiler, Object.assign(clientConfig.devServer, {
    verbose: true
  }));

  clientDevServer.listen(port, function (err) {
    if (err) logger.error(err);
  });
}

setPorts().then(main).catch(console.error);