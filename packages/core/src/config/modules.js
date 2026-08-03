import fs from 'node:fs';
import path from 'node:path';
import JSON5 from 'json5';
import paths from './paths.js';
import { nodePath } from './env.js';

function getAdditionalModulePaths(options = {}) {
  if (options.baseUrl == null)
    return nodePath.split(path.delimiter).filter(Boolean);

  const baseUrl = path.resolve(paths.applicationDirectory, options.baseUrl);
  if (baseUrl === paths.nodeModulesDirectory) return [];
  if (baseUrl === paths.applicationSource) return [paths.applicationSource];

  throw new Error(
    "The TypeScript/JavaScript 'baseUrl' must be either 'src' or 'node_modules'.",
  );
}

function loadConfiguration() {
  const hasTypeScriptConfig = fs.existsSync(paths.appTsConfig);
  const hasJavaScriptConfig = fs.existsSync(paths.appJsConfig);
  if (hasTypeScriptConfig && hasJavaScriptConfig) {
    throw new Error('Remove jsconfig.json when using tsconfig.json.');
  }

  if (hasTypeScriptConfig) {
    return JSON5.parse(fs.readFileSync(paths.appTsConfig, 'utf8'));
  }
  if (hasJavaScriptConfig) {
    return JSON5.parse(fs.readFileSync(paths.appJsConfig, 'utf8'));
  }
  return {};
}

const configuration = loadConfiguration();
const modules = {
  additionalModulePaths: getAdditionalModulePaths(
    configuration.compilerOptions,
  ),
};

export { getAdditionalModulePaths, loadConfiguration };
export default modules;
