import fs from 'node:fs';
import path from 'node:path';
import type { Config } from '@react-router/dev/config';
import type { UserConfig } from 'vite';
import { normalizeI18n } from './i18n.js';
import { nessRoutePaths, nessRoutes } from './routes.js';
import type { NessRoute, NessRoutesOptions } from './routes.js';
import type { I18nConfig, NormalizedI18nConfig } from './i18n.js';

export {
  RESERVED_FILES,
  ROUTE_EXTENSIONS,
  segmentPath,
  nessInterceptors,
  nessRoutes,
  nessRoutePaths,
} from './routes.js';
export type {
  InterceptorEntry,
  NessRoute,
  NessRoutePath,
  NessRoutesOptions,
  PagePrefetchInfo,
  SegmentConfig,
} from './routes.js';
export {
  localizePath,
  matchAcceptLanguage,
  normalizeI18n,
  resolveLocale,
} from './i18n.js';
export type {
  I18nConfig,
  I18nStrategy,
  NormalizedI18nConfig,
  ResolvedLocale,
} from './i18n.js';

export interface CacheProfileWindow {
  stale: number;
  revalidate: number;
  expire: number;
}

export interface NessConfig extends Config {
  cache?: {
    profiles?: Record<string, CacheProfileWindow>;
  };
  deployment?: {
    runtime?: 'node' | 'edge' | 'serverless';
    [key: string]: unknown;
  };
  /**
   * Validated here and recorded in the build manifest. Pass the same object to
   * `nessRoutes({ i18n })` in `app/routes.ts` to generate localized routes.
   */
  i18n?: I18nConfig;
  routeDirectory?: string;
  rsc?: boolean;
  /**
   * The application-wide default for how many seconds a client-side
   * navigation may reuse a page's data from memory instead of refetching its
   * loader. A page's own `export const clientCache = N` overrides it, and
   * `clientCache = 0` opts that page back out. Off (`0`) when omitted.
   */
  clientCache?: number;
  /**
   * Serves the whole application under a path prefix — `/docs` — the way
   * Next's `basePath` does. Routing, links, assets and the image endpoint all
   * move with it; it is React Router's `basename` plus Vite's `base` plus the
   * production server's mounts, stated once.
   */
  basePath?: string;
  /**
   * Where built assets are loaded from — a CDN origin, typically. Applies to
   * the production build only; development stays local. Routes and the image
   * endpoint keep following `basePath`.
   */
  assetPrefix?: string;
}

export interface NessInstrumentationConfig {
  register?(): void | Promise<void>;
  onError?(context: { error: unknown }): void | Promise<void>;
  [hook: string]: unknown;
}

export interface UnifiedNessConfig {
  vite?: UserConfig;
  router?: NessConfig;
  server?: Record<string, unknown>;
  instrumentation?: NessInstrumentationConfig;
}

export interface ResolvedUnifiedNessConfig extends UserConfig {
  ness: {
    router: NessConfig;
    server: Record<string, unknown>;
    instrumentation?: NessInstrumentationConfig | undefined;
  };
}

export interface NessManifest {
  version: 1;
  generatedAt: string;
  basename: string | undefined;
  basePath?: string | undefined;
  assetPrefix?: string | undefined;
  routes: Record<string, unknown>;
  pages: unknown[];
  /** Concrete paths the build prerendered, for `dynamicParams: false`. */
  prerenderedPaths?: string[];
  cache: NonNullable<NessConfig['cache']>;
  deployment: NonNullable<NessConfig['deployment']>;
  i18n?: I18nConfig | NormalizedI18nConfig;
}

export interface ManifestPayloadOptions {
  basename?: string | undefined;
  basePath?: string | undefined;
  assetPrefix?: string | undefined;
  routes?: Record<string, unknown>;
  pages?: unknown[];
  prerenderedPaths?: string[] | undefined;
  cache?: NessConfig['cache'];
  deployment?: NessConfig['deployment'];
  i18n?: I18nConfig | NormalizedI18nConfig | undefined;
}

const DEFAULT_CACHE_PROFILES: Record<string, CacheProfileWindow> = {
  default: { stale: 300, revalidate: 900, expire: 31536000 },
  seconds: { stale: 1, revalidate: 5, expire: 30 },
  minutes: { stale: 60, revalidate: 300, expire: 3600 },
  hours: { stale: 300, revalidate: 3600, expire: 86400 },
  days: { stale: 3600, revalidate: 86400, expire: 604800 },
};

type BuildEndHook = NonNullable<Config['buildEnd']>;

function chainHooks(
  first: BuildEndHook | undefined,
  second: BuildEndHook,
): BuildEndHook {
  if (!first) return second;
  if (!second) return first;
  return async value => {
    await first(value);
    await second(value);
  };
}

/**
 * The `ness-manifest.json` payload shape, shared by both the classic
 * `buildEnd`-driven path below and the RSC `buildApp`-driven path in
 * `./vite/index.js` — RSC Framework Mode rejects a `buildEnd` config option
 * outright, so it cannot reuse this function's caller, only this shape.
 */
function buildManifestPayload({
  basename,
  basePath,
  assetPrefix,
  routes,
  pages,
  prerenderedPaths,
  cache,
  deployment,
  i18n,
}: ManifestPayloadOptions): NessManifest {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    basename,
    ...(basePath ? { basePath } : {}),
    ...(assetPrefix ? { assetPrefix } : {}),
    routes: routes || {},
    // Every page as a full URL pattern, with whatever `revalidate` /
    // `dynamic` it declared. The production server reads this to answer a
    // question it has before it renders anything: may this URL be served from
    // the shared cache, and for how long is a stored copy good.
    pages: pages || [],
    ...(prerenderedPaths?.length ? { prerenderedPaths } : {}),
    cache: cache || { profiles: DEFAULT_CACHE_PROFILES },
    deployment: deployment || { runtime: 'node' },
    ...(i18n ? { i18n } : {}),
  };
}

function writeNessManifest(
  buildDirectory: string,
  payload: NessManifest,
): void {
  const filename = path.join(buildDirectory, 'ness-manifest.json');
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(payload, null, 2)}\n`);
}

function writeBuildManifest(options: {
  cache?: NessConfig['cache'];
  deployment?: NessConfig['deployment'];
  i18n?: I18nConfig | NormalizedI18nConfig | undefined;
  basePath?: string | undefined;
  assetPrefix?: string | undefined;
  prerenderedPaths?: string[] | undefined;
}): BuildEndHook {
  return async ({ buildManifest, reactRouterConfig }) => {
    writeNessManifest(
      reactRouterConfig.buildDirectory,
      buildManifestPayload({
        basename: reactRouterConfig.basename,
        basePath: options.basePath,
        assetPrefix: options.assetPrefix,
        routes: (buildManifest?.routes || {}) as Record<string, unknown>,
        pages: await nessRoutePaths({
          appDirectory: reactRouterConfig.appDirectory,
          i18n: options.i18n,
        }).catch(() => []),
        prerenderedPaths: options.prerenderedPaths,
        cache: options.cache,
        deployment: options.deployment,
        i18n: options.i18n,
      }),
    );
  };
}

function defineConfig(options: NessConfig = {}): Config {
  const {
    cache,
    deployment,
    buildEnd,
    prerender,
    rsc = true,
    routeDirectory,
    i18n,
    basePath,
    assetPrefix,
    // Consumed by route generation (`nessRoutes` reads it off the config
    // file); pulled out here so React Router never sees an option it does
    // not know.
    clientCache,
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
    // Every route is compiled into the build's client manifest
    // (`assets/manifest-*.js`, a hashed immutable asset), the way Next.js
    // ships its route table: a production navigation resolves against the
    // compiled routes it already holds and goes straight for the route's
    // chunk and data. `lazy` would put a `/__manifest` discovery round trip
    // in front of every first navigation — and a failed discovery degrades
    // to a full document load, which is the "slow navigation" a deployment
    // behind an aggressive CDN or proxy actually experiences. An application
    // that prefers discovery-on-demand can still say `routeDiscovery:
    // { mode: 'lazy' }` itself.
    routeDiscovery: { mode: 'initial' },
    future: {
      unstable_enableNodeReadableStream: true,
      ...(reactRouterOptions.future || {}),
    },
    // `basePath` is React Router's `basename`, stated in the word every
    // migrating project already uses. An explicit `basename` still wins.
    ...(basePath ? { basename: basePath } : {}),
    ...reactRouterOptions,
    prerender,
    ...(rsc
      ? {}
      : {
          buildEnd: chainHooks(
            buildEnd,
            writeBuildManifest({
              cache,
              deployment,
              i18n: localization,
              basePath,
              assetPrefix,
              prerenderedPaths: Array.isArray(prerender)
                ? prerender.map(String)
                : undefined,
            }),
          ),
        }),
  } as Config;
}

function defineNessConfig({
  vite = {},
  router = {},
  server = {},
  instrumentation,
}: UnifiedNessConfig = {}): ResolvedUnifiedNessConfig {
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

function resolveNessRouterConfig(
  config: ResolvedUnifiedNessConfig | undefined,
  root: string = process.cwd(),
): Config {
  return defineConfig({
    appDirectory: path.join(root, 'app'),
    buildDirectory: path.join(root, 'build'),
    ...(config?.ness?.router || {}),
  });
}

function defineRoutes(options?: NessRoutesOptions): Promise<NessRoute[]> {
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
  buildManifestPayload,
  DEFAULT_CACHE_PROFILES,
  defineConfig,
  defineNessConfig,
  defineRoutes,
  resolveNessRouterConfig,
  writeNessManifest,
};
export default config;
