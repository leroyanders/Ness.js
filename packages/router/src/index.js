import fs from 'node:fs';
import path from 'node:path';
import { normalizeI18n } from './i18n.js';
import { nessRoutes } from './routes.js';

export { RESERVED_FILES, ROUTE_EXTENSIONS, segmentPath } from './routes.js';
export {
  localizePath,
  matchAcceptLanguage,
  normalizeI18n,
  resolveLocale,
} from './i18n.js';

const DEFAULT_CACHE_PROFILES = {
  default: { stale: 300, revalidate: 900, expire: 31536000 },
  seconds: { stale: 1, revalidate: 5, expire: 30 },
  minutes: { stale: 60, revalidate: 300, expire: 3600 },
  hours: { stale: 300, revalidate: 3600, expire: 86400 },
  days: { stale: 3600, revalidate: 86400, expire: 604800 },
};

function chainHooks(first, second) {
  if (!first) return second;
  if (!second) return first;
  return async value => {
    await first(value);
    await second(value);
  };
}

function writeBuildManifest(options) {
  return async ({ buildManifest, reactRouterConfig }) => {
    const output = {
      version: 1,
      generatedAt: new Date().toISOString(),
      basename: reactRouterConfig.basename,
      routes: buildManifest?.routes || {},
      cache: options.cache || { profiles: DEFAULT_CACHE_PROFILES },
      deployment: options.deployment || { runtime: 'node' },
      ...(options.i18n ? { i18n: options.i18n } : {}),
    };
    const filename = path.join(
      reactRouterConfig.buildDirectory,
      'ness-manifest.json',
    );
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, `${JSON.stringify(output, null, 2)}\n`);
  };
}

function defineConfig(options = {}) {
  const {
    cache,
    deployment,
    buildEnd,
    prerender,
    rsc = false,
    routeDirectory,
    i18n,
    ...reactRouterOptions
  } = options;
  // Validated here so a typo in ness.config.mjs fails immediately with a
  // message naming the field. Route generation itself stays in app/routes.ts —
  // `nessRoutes({i18n})` — rather than being injected behind the developer's
  // back, which would silently override a hand-written route tree.
  const localization = normalizeI18n(i18n);
  return {
    appDirectory: 'app',
    buildDirectory: 'build',
    serverModuleFormat: 'esm',
    splitRouteModules: true,
    ssr: true,
    subResourceIntegrity: true,
    routeDiscovery: { mode: 'lazy' },
    future: {
      unstable_enableNodeReadableStream: true,
      ...(reactRouterOptions.future || {}),
    },
    ...reactRouterOptions,
    ...(rsc ? {} : { prerender }),
    ...(rsc
      ? {}
      : {
          buildEnd: chainHooks(
            buildEnd,
            writeBuildManifest({ cache, deployment, i18n: localization }),
          ),
        }),
  };
}

function defineNessConfig({
  vite = {},
  router = {},
  server = {},
  instrumentation,
} = {}) {
  const root = process.cwd();
  return {
    publicDir: path.join(root, 'public'),
    envDir: root,
    cacheDir: path.join(root, '.ness', 'vite'),
    ...vite,
    build: {
      emptyOutDir: true,
      ...(vite.build || {}),
    },
    ness: { router, server, instrumentation },
  };
}

function resolveNessRouterConfig(config, root = process.cwd()) {
  return defineConfig({
    appDirectory: path.join(root, 'app'),
    buildDirectory: path.join(root, 'build'),
    ...(config?.ness?.router || {}),
  });
}

function defineRoutes(options) {
  return nessRoutes(options);
}

const config = {
  DEFAULT_CACHE_PROFILES,
  defineConfig,
  defineNessConfig,
  defineRoutes,
  nessRoutes,
  resolveNessRouterConfig,
};

export {
  DEFAULT_CACHE_PROFILES,
  defineConfig,
  defineNessConfig,
  defineRoutes,
  nessRoutes,
  resolveNessRouterConfig,
};
export default config;
