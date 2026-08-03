import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const applicationDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath =>
  path.resolve(applicationDirectory, relativePath);
const resolveOwn = relativePath =>
  path.resolve(currentDirectory, '..', '..', relativePath);

function ensureSlash(value, needsSlash) {
  const hasSlash = value.endsWith('/');
  if (hasSlash && !needsSlash) return value.slice(0, -1);
  if (!hasSlash && needsSlash) return `${value}/`;
  return value;
}

function getPublicUrl(packagePath) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return process.env.PUBLIC_URL || packageJson.homepage;
}

function getServedPath(packagePath) {
  const publicUrl = getPublicUrl(packagePath);
  if (!publicUrl) return '/';

  try {
    return ensureSlash(new URL(publicUrl, 'http://localhost').pathname, true);
  } catch {
    return '/';
  }
}

function chooseEntry(typescriptEntry, javascriptEntry) {
  return fs.existsSync(typescriptEntry) ? typescriptEntry : javascriptEntry;
}

const applicationPackage = resolveApp('package.json');
const serverTypescriptEntry = resolveApp('src/server/index.ts');
const serverJavascriptEntry = resolveApp('src/server/index.js');
const clientTypescriptEntry = resolveApp('src/client/index.tsx');
const clientJavascriptEntry = resolveApp('src/client/index.js');

const paths = {
  dotenv: resolveApp('.env'),
  applicationDirectory,
  appdeploy: resolveApp('deploy'),
  appdeployPublic: resolveApp('deploy/public'),
  assets: resolveApp('deploy/assets.json'),
  chunks: resolveApp('deploy/chunks.json'),
  publicDirectory: resolveApp('public'),
  nodeModulesDirectory: resolveApp('node_modules'),
  applicationSource: resolveApp('src'),
  appTemplate: resolveApp('public/index.html'),
  applicationPackage,
  serverEntry: chooseEntry(serverTypescriptEntry, serverJavascriptEntry),
  clientIndex: chooseEntry(clientTypescriptEntry, clientJavascriptEntry),
  clientDirectory: resolveApp('src/client'),
  babelConfigPath: resolveApp('.babelrc'),
  nessConfig: resolveApp('ness.config.js'),
  ownPath: resolveOwn('.'),
  ownNodeModules: resolveOwn('node_modules'),
  publicUrl: getPublicUrl(applicationPackage),
  servedPath: getServedPath(applicationPackage),
  appJsConfig: resolveApp('jsconfig.json'),
  appTsConfig: resolveApp('tsconfig.json'),
};

export default paths;
