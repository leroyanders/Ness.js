var paths = require('./paths');
var fs = require('fs');
var path = require('path');

var NODE_ENV = process.env.NODE_ENV;
var appDirectory = fs.realpathSync(process.cwd());
var nodePath = (process.env.NODE_PATH || '').split(path.delimiter).filter(function (folder) {
  return folder && !path.isAbsolute(folder);
}).map(function (folder) {
  return path.resolve(appDirectory, folder);
}).join(path.delimiter);

var NESS = /^NESS_/i; 

// delete cached paths
delete require.cache[require.resolve('./paths')];

// .env file
var dotenvFiles = ["".concat(paths.dotenv, ".").concat(NODE_ENV, ".local"), "".concat(paths.dotenv, ".").concat(NODE_ENV), "".concat(paths.dotenv, ".local"), paths.dotenv];

dotenvFiles.forEach(function (dotenvFile) {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv-expand')(require('dotenv').config({
      path: dotenvFile
    }));
  }
});

function clientEnvironmentironment(target, options) {
  var raw = Object.keys(process.env).filter(function (key) {
    return NESS.test(key);
  }).reduce(function (env, key) {
    env[key] = process.env[key];
    return env;
  }, {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || options.port || 3000,
    VERBOSE: !!process.env.VERBOSE,
    HOST: process.env.HOST || options.host || 'localhost',
    NESS_ASSETS_MANIFEST: paths.assets,
    NESS_CHUNKS_MANIFEST: paths.chunks,
    BUILD_TARGET: target === 'web' ? 'client' : 'server',
    PUBLIC_PATH: process.env.PUBLIC_PATH || '/',
    CLIENT_PUBLIC_PATH: process.env.CLIENT_PUBLIC_PATH,
    NESS_PUBLIC_DIR: process.env.NODE_ENV === 'production' ? paths.appdeployPublic : paths.publicDirectory
  });
  var stringified = Object.keys(raw).reduce(function (env, key) {
    env["process.env.".concat(key)] = JSON.stringify(raw[key]);
    return env;
  }, {});
  return {
    raw: raw,
    stringified: stringified
  };
}

module.exports = {
  clientEnvironment: clientEnvironmentironment,
  nodePath: nodePath
};