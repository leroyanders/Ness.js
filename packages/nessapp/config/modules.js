var fs = require('fs');
var path = require('path');
var paths = require('./paths');
var logger = require('../utils/logger');
var resolve = require('resolve');
var nodePath = require('./env').nodePath;

function loadNodeModules() {
  var hasTypeScriptConfig = fs.existsSync(paths.appTsConfig);
  var hasJavaScriptConfig = fs.existsSync(paths.appJsConfig);
  if (hasTypeScriptConfig && hasJavaScriptConfig) throw new Error('You have both a tsconfig.json and a jsconfig.json. If you are using TypeScript please remove your jsconfig.json file.');
  var config;

  if (hasTypeScriptConfig) {
    var TypeScript = require(resolve.sync('typescript', {
      basedir: paths.nodeModulesDirectory
    }));

    config = TypeScript.readConfigFile(paths.appTsConfig, TypeScript.sys.readFile).config;
  } else if (hasJavaScriptConfig) {
    config = require(paths.appJsConfig);
  }

  config = config || {};
  var options = config.compilerOptions || {};
  var additionalModulePaths = getAdditionalModulePaths(options);
  return {
    additionalModulePaths: additionalModulePaths
  };
}

function getAdditionalModulePaths() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var baseUrl = options.baseUrl;
  if (baseUrl == null) return nodePath.split(path.delimiter).filter(Boolean);
  var baseUrlResolved = path.resolve(paths.applicationDirectory, baseUrl);
  if (path.relative(paths.nodeModulesDirectory, baseUrlResolved) === '') return null;

  if (path.relative(paths.applicationSource, baseUrlResolved) === '') {
    return [paths.applicationSource];
  }

  throw new Error(logger.error("Your project's `baseUrl` can only be set to `src` or `node_modules`." + ' NessJS does not support other values at this time.'));
}

module.exports = loadNodeModules();