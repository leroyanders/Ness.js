import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import paths from './paths.js';

const appDirectory = fs.realpathSync(process.cwd());
const nodePath = (process.env.NODE_PATH || '')
  .split(path.delimiter)
  .filter(Boolean)
  .map(folder =>
    path.isAbsolute(folder) ? folder : path.resolve(appDirectory, folder),
  )
  .join(path.delimiter);

const dotenvFiles = [
  `${paths.dotenv}.${process.env.NODE_ENV}.local`,
  `${paths.dotenv}.${process.env.NODE_ENV}`,
  `${paths.dotenv}.local`,
  paths.dotenv,
];

function expandVariables(parsed) {
  const resolved = {};

  function resolveKey(key, stack = new Set()) {
    if (Object.prototype.hasOwnProperty.call(resolved, key))
      return resolved[key];
    if (stack.has(key)) return parsed[key] || '';
    stack.add(key);

    const raw = parsed[key] ?? process.env[key] ?? '';
    const value = String(raw).replace(
      /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}|\$([A-Za-z_][A-Za-z0-9_]*)/g,
      (_match, bracedKey, fallback, plainKey) => {
        const variable = bracedKey || plainKey;
        const expanded = resolveKey(variable, new Set(stack));
        return expanded || fallback || '';
      },
    );
    resolved[key] = value;
    return value;
  }

  for (const key of Object.keys(parsed)) resolveKey(key);
  return Object.fromEntries(
    Object.keys(parsed).map(key => [key, resolved[key]]),
  );
}

for (const dotenvFile of dotenvFiles) {
  if (fs.existsSync(dotenvFile)) {
    const result = dotenv.config({ path: dotenvFile });
    if (!result.error && result.parsed) {
      const expanded = expandVariables(result.parsed);
      for (const [key, value] of Object.entries(expanded)) {
        if (process.env[key] === result.parsed[key]) process.env[key] = value;
      }
    }
  }
}

function clientEnvironment(target, options = {}) {
  const raw = Object.keys(process.env)
    .filter(key => /^NESS_/i.test(key))
    .reduce(
      (environment, key) => ({ ...environment, [key]: process.env[key] }),
      {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.PORT || options.port || 3000,
        VERBOSE: Boolean(process.env.VERBOSE),
        HOST: process.env.HOST || options.host || 'localhost',
        NESS_ASSETS_MANIFEST: paths.assets,
        NESS_CHUNKS_MANIFEST: paths.chunks,
        BUILD_TARGET: target === 'web' ? 'client' : 'server',
        PUBLIC_PATH: process.env.PUBLIC_PATH || '/',
        CLIENT_PUBLIC_PATH: process.env.CLIENT_PUBLIC_PATH,
        NESS_PUBLIC_DIR:
          process.env.NODE_ENV === 'production'
            ? paths.appdeployPublic
            : paths.publicDirectory,
      },
    );

  const stringified = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      `process.env.${key}`,
      JSON.stringify(value),
    ]),
  );

  return { raw, stringified };
}

export { clientEnvironment, expandVariables, nodePath };
