#! /usr/bin/env node
process.env.NODE_ENV = 'production';
process.on('unhandledRejection', function (err) {
  throw err;
});

require('../config/env');

var webpack = require('webpack');
var fs = require('fs-extra');
var chalk = require('chalk');
var paths = require('../config/paths');
var createConfig = require('../config/config');
var printErrors = require('../utils/printErrors');
var clearConsole = require('react-dev-utils/clearConsole');
var logger = require('../utils/logger');
var FileSizeReporter = require('react-dev-utils/FileSizeReporter');
var formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
var measureFileSizesBeforeBuild = FileSizeReporter.measureFileSizesBeforeBuild;
var printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

measureFileSizesBeforeBuild(paths.appdeployPublic).then(function (previousFileSizes) {
  fs.emptyDirSync(paths.appdeploy);
  copyPublicFolder();

  return build(previousFileSizes);
}).then(function (_ref) {
  var stats = _ref.stats,
      previousFileSizes = _ref.previousFileSizes,
      warnings = _ref.warnings;

  if (warnings.length) {
    console.log(chalk.yellow('\nCompiled with warnings.\n'));
  } else console.log(chalk.green('\nApplication compiled successfully.\n'));

  console.log('Generated bundles:\n');
  printFileSizesAfterBuild(stats, previousFileSizes, paths.appdeploy);
  
}, function (err) {
  console.log(chalk.red('Failed to compile.\n'));
  console.log((err.message || err) + '\n');
  process.exit(1);
});

function build(previousFileSizes) {
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

  var serverConfig;
  var clientConfig = createConfig('web', 'prod', ness, webpack);
  var serverConfig = createConfig('node', 'prod', ness, webpack);

  process.noDeprecation = true;

  console.log('Creating an optimized production build...\n');
  console.log('Compiling client...');

  return new Promise(function (resolve, reject) {
    compile(clientConfig, function (err, clientStats) {
      if (err) reject(err);
      var clientMessages = formatWebpackMessages(clientStats.toJson({}, true));
      if (clientMessages.errors.length) return reject(new Error(clientMessages.errors.join('\n\n')));

      console.log(chalk.green('Compiled client successfully.\n'));
      console.log('Compiling server...');

      compile(serverConfig, function (err, serverStats) {
        if (err) reject(err);
        var serverMessages = formatWebpackMessages(serverStats.toJson({}, true));
        if (serverMessages.errors.length) return reject(new Error(serverMessages.errors.join('\n\n')));

        console.log(chalk.green('Compiled server successfully.'));
        return resolve({
          stats: clientStats,
          previousFileSizes: previousFileSizes,
          warnings: Object.assign({}, clientMessages.warnings, serverMessages.warnings)
        });
      });
    });
  });
}

function copyPublicFolder() {
  fs.copySync(paths.publicDirectory, paths.appdeployPublic, {
    dereference: true,
    filter: function filter(file) {
      return file !== paths.appTemplate;
    }
  });
}

function compile(config, cb) {
  var compiler;

  try {
    compiler = webpack(config);
  } catch (e) {
    printErrors('Failed to compile.', [e]);
    process.exit(1);
  }

  compiler.run(function (err, stats) {
    return cb(err, stats);
  });
}