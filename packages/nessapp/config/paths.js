var path = require('path');
var fs = require('fs');
var url = require('url');
var appDirectory = fs.realpathSync(process.cwd());
var envPublicUrl = process.env.PUBLIC_URL;

var resolveDirectoryPathname = function resolveDirectoryPathname(relativePath) {
  return path.resolve(appDirectory, relativePath);
};

var os = require('os');

function ensureSlash(path, needsSlash) {
  var hasSlash = path.endsWith('/');
  if (hasSlash && !needsSlash) return path.substr(path, path.length - 1);else if (!hasSlash && needsSlash) return "".concat(path, "/");else return path;
}

function getServedPath(applicationPackage) {
  var publicUrl = getPublicUrl(applicationPackage);
  var servedUrl = envPublicUrl || (publicUrl ? url.parse(publicUrl).pathname : '/');
  return ensureSlash(servedUrl, true);
}

var getPublicUrl = function getPublicUrl(applicationPackage) {
  return envPublicUrl || require(applicationPackage).homepage;
};

var resolveRootDirectoryPathname = function resolveRootDirectoryPathname(relativePath) {
  return path.resolve(__dirname, '..', relativePath);
};

var nodePathesResolve = (process.env.NODE_PATH || '').split(os.platform() === 'win32' ? ';' : ':').filter(Boolean).filter(function (folder) {
  return !path.isAbsolute(folder);
}).map(resolveDirectoryPathname);
module.exports = {
  dotenv: resolveDirectoryPathname('.env'),
  applicationDirectory: resolveDirectoryPathname('.'),
  appdeploy: resolveDirectoryPathname('deploy'),
  appdeployPublic: resolveDirectoryPathname('deploy/public'),
  assets: resolveDirectoryPathname('deploy/assets.json'),
  chunks: resolveDirectoryPathname('deploy/chunks.json'),
  publicDirectory: resolveDirectoryPathname('public'),
  nodeModulesDirectory: resolveDirectoryPathname('node_modules'),
  applicationSource: resolveDirectoryPathname('src'),
  appTemplate: resolveDirectoryPathname('public/index.html'),
  applicationPackage: resolveDirectoryPathname('package.json'),
  serverEntry: resolveDirectoryPathname('src/server/index.js'),
  clientIndex: resolveDirectoryPathname('src/client/index.js'),
  clientDirectory: resolveDirectoryPathname('src/client'),
  tsTestsSetup: resolveDirectoryPathname('src/setupTests.ts'),
  jsTestsSetup: resolveDirectoryPathname('src/setupTests.js'),
  babelConfigPath: resolveDirectoryPathname('.babelrc'),
  nessConfig: resolveDirectoryPathname('ness.config.js'),
  nodePathesResolve: nodePathesResolve,
  ownPath: resolveRootDirectoryPathname('.'),
  ownNodeModules: resolveRootDirectoryPathname('node_modules'),
  publicUrl: getPublicUrl(resolveDirectoryPathname('package.json')),
  servedPath: getServedPath(resolveDirectoryPathname('package.json')),
  appJsConfig: resolveDirectoryPathname('jsconfig.json'),
  appTsConfig: resolveDirectoryPathname('tsconfig.json')
};