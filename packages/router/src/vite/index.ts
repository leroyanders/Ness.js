import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { reactRouter, unstable_reactRouterRSC } from '@react-router/dev/vite';
import type { Plugin, PluginOption, ViteDevServer } from 'vite';
import { buildManifestPayload, writeNessManifest } from '../index.js';
import type { NessConfig } from '../index.js';
import { nessInterceptors, nessRoutePaths, nessRoutes } from '../routes.js';
import type { NessRoute } from '../routes.js';
import type { I18nConfig } from '../i18n.js';
import { nessErrorOverlay } from './overlay.js';
import type { NessErrorOverlayOptions } from './overlay.js';

export type { NessErrorOverlayOptions } from './overlay.js';

export interface NessViteOptions {
  root?: string;
  appDirectory?: string;
  configFile?: string;
  rsc?: boolean;
  i18n?: I18nConfig;
  plugins?: PluginOption[];
  /**
   * Development error overlay. Enabled by default; pass `false` to fall back to
   * Vite's plain "Internal Server Error" response.
   */
  overlay?: boolean | NessErrorOverlayOptions;
}

/**
 * `@vitejs/plugin-rsc` is an optional peer: only RSC applications install it.
 * Vite accepts a promise in the plugin array, so importing it lazily keeps a
 * non-RSC build from failing on a package it never needed.
 */
const PREFETCH_MODULE = 'virtual:ness/route-prefetch';
const INTERCEPTOR_MODULE = 'virtual:ness/interceptors';

/**
 * Config filenames, most preferred first. `.ts` leads because that is what
 * `ness new` now scaffolds; the other two keep every existing project working.
 */
const CONFIG_FILES = ['ness.config.ts', 'ness.config.mjs', 'ness.config.js'];

/** The config this root actually has, or the preferred name when it has none. */
function resolveConfigFile(root: string, explicit?: string): string {
  if (explicit) return explicit;
  return (
    CONFIG_FILES.find(candidate =>
      fs.existsSync(path.resolve(root, candidate)),
    ) ?? CONFIG_FILES[0]!
  );
}

function rscPlugin(): Promise<Plugin[]> {
  // Only the rejection handler reports the missing package: an error thrown by
  // the factory itself is the plugin's own and must not be relabelled.
  return import('@vitejs/plugin-rsc').then(
    module => {
      const factory = ((module as { default?: unknown }).default ??
        module) as () => Plugin[];
      return factory();
    },
    () => {
      throw new Error(
        'RSC mode requires @vitejs/plugin-rsc. Install it with: npm install -D @vitejs/plugin-rsc',
      );
    },
  );
}

type FlatRouteManifest = Record<string, Record<string, unknown>>;

/**
 * `nessRoutes()` returns a tree (routes nest `children`); `ness-manifest.json`
 * records a flat, id-keyed map instead, matching the shape a React-Router
 * `buildEnd` hook would have handed `writeBuildManifest` in non-RSC mode.
 */
function flattenRouteTree(
  routes: NessRoute[],
  parentId?: string,
  manifest: FlatRouteManifest = {},
): FlatRouteManifest {
  for (const route of routes) {
    const { children, ...entry } = route;
    manifest[route.id] = { ...entry, parentId };
    if (children) flattenRouteTree(children, route.id, manifest);
  }
  return manifest;
}

/**
 * RSC Framework Mode's `validateConfig` rejects a `buildEnd` config option
 * outright, so `ness-manifest.json` can't be written the way the non-RSC path
 * writes it (see `writeBuildManifest` in `../index.ts`). This writes the same
 * manifest shape from a plugin-level `buildApp` hook instead — a hook Vite's
 * Builder API calls once after every environment (client/rsc/ssr) finishes,
 * independent of React Router's own `buildEnd` wiring. Route data comes from
 * Ness's own `nessRoutes()` rather than React Router's `buildManifest`, since
 * RSC mode never produces one.
 */
async function writeRscManifest({
  root,
  appDirectory,
  configFile,
}: {
  root: string;
  appDirectory: string;
  configFile: string;
}): Promise<void> {
  const absoluteConfigFile = path.resolve(root, configFile);
  if (!fs.existsSync(absoluteConfigFile)) return;
  const imported = (await import(
    /* @vite-ignore */ pathToFileURL(absoluteConfigFile).href
  )) as { default?: { ness?: { router?: NessConfig } } } & {
    ness?: { router?: NessConfig };
  };
  const config = imported.default || imported;
  const routerOptions: NessConfig = config?.ness?.router || {};
  const absoluteAppDirectory = path.resolve(root, appDirectory);
  const buildDirectory = path.resolve(
    root,
    routerOptions.buildDirectory || 'build',
  );
  const routes = await nessRoutes({
    appDirectory: absoluteAppDirectory,
    i18n: routerOptions.i18n,
  });
  writeNessManifest(
    buildDirectory,
    buildManifestPayload({
      basename: routerOptions.basename || routerOptions.basePath || '/',
      basePath: routerOptions.basePath,
      assetPrefix: routerOptions.assetPrefix,
      routes: flattenRouteTree(routes),
      pages: await nessRoutePaths({
        appDirectory: absoluteAppDirectory,
        i18n: routerOptions.i18n,
      }),
      prerenderedPaths: Array.isArray(routerOptions.prerender)
        ? routerOptions.prerender.map(String)
        : undefined,
      cache: routerOptions.cache,
      deployment: routerOptions.deployment,
      i18n: routerOptions.i18n,
    }),
  );
}

/**
 * The application directory a given Vite root is actually serving.
 *
 * A Vite root is not always the project root. `ness dev` points React Router
 * at a generated root under `.ness/config`, which holds a `react-router.config
 * .mjs` and an `app/` of nothing but generated types — no `routes/`, and never
 * any. Resolving `app` against that root names a directory that has never
 * existed, which is what this used to hand to `nessRoutes` on every start.
 *
 * So the question is asked of the filesystem instead of assumed: the nearest
 * `app/routes` from here upwards. `undefined` when there is none — that Vite
 * server is not serving a Ness route tree, and has nothing to keep in sync.
 */
function resolveAppDirectory(
  root: string,
  appDirectory: string,
): string | undefined {
  let current = path.resolve(root);
  for (;;) {
    const candidate = path.resolve(current, appDirectory);
    if (fs.existsSync(path.join(candidate, 'routes'))) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

/**
 * The `basePath`/`assetPrefix` pair from the project's config file, read the
 * same lazy way the manifest writer reads it. Absent file, absent fields:
 * both come back undefined and nothing changes.
 */
async function readPathOptions(
  root: string,
  configFile: string,
): Promise<{ basePath?: string | undefined; assetPrefix?: string | undefined }> {
  const absolute = path.resolve(root, configFile);
  if (!fs.existsSync(absolute)) return {};
  try {
    const imported = (await import(
      /* @vite-ignore */ pathToFileURL(absolute).href
    )) as { default?: { ness?: { router?: NessConfig } } } & {
      ness?: { router?: NessConfig };
    };
    const config = imported.default || imported;
    const router = config?.ness?.router || {};
    return { basePath: router.basePath, assetPrefix: router.assetPrefix };
  } catch {
    return {};
  }
}

/** `/docs` → `/docs/`, the shape Vite's `base` insists on. */
function toBase(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.endsWith('/') ? value : `${value}/`;
}

function nessVitePlugin(options: NessViteOptions = {}): Plugin {
  const configFile = resolveConfigFile(
    options.root || process.cwd(),
    options.configFile,
  );
  // Defaults to RSC when called directly (not just through `ness()`), so a
  // bare `nessVitePlugin()` and a bare `ness()` agree on what "no `rsc`
  // option given" means.
  const rsc = options.rsc !== false;
  return {
    name: 'ness:framework',
    enforce: 'pre',
    async config(_config, env) {
      const { basePath, assetPrefix } = await readPathOptions(
        options.root || process.cwd(),
        configFile,
      );
      // Assets follow the CDN prefix in builds only; in development they are
      // served by this very server, prefix or not. Routing always follows
      // `basePath` — that part is React Router's `basename`, set in the
      // router config.
      const base =
        env.command === 'build'
          ? toBase(assetPrefix) || toBase(basePath)
          : toBase(basePath);
      return {
        ...(base ? { base } : {}),
        // The client runtime needs the path prefix at runtime — the image
        // endpoint and prefetch table live under it.
        define: {
          'import.meta.env.NESS_PUBLIC_BASE_PATH': JSON.stringify(
            basePath || '',
          ),
        },
        envPrefix: ['VITE_', 'NESS_PUBLIC_'],
        ...(rsc
          ? {
              ssr: { noExternal: ['react-router'] },
              environments: {
                rsc: { resolve: { noExternal: ['react-router'] } },
                ssr: { resolve: { noExternal: ['react-router'] } },
              },
            }
          : {}),
        // The framework's own runtime is source, not a third-party bundle, and
        // pre-bundling it makes it stale in the one situation that matters:
        // someone editing Ness itself alongside an application. Vite keys the
        // optimizer's cache to the lockfile, so a changed file inside
        // node_modules is invisible until the cache is deleted by hand — and
        // the symptom is an export that "does not exist" while it plainly
        // does. Excluded here so it is always read from disk.
        optimizeDeps: {
          exclude: [
            '@nessframework/core',
            '@nessframework/core/client',
            '@nessframework/components',
          ],
        },
        server: {
          headers: { 'x-powered-by': 'Ness.js' },
          // Excluding the runtime from pre-bundling is only half of it: Vite
          // ignores node_modules in its watcher, so an edited framework file
          // still sits in the module cache until the server restarts. This
          // un-ignores the framework's own packages, which is exactly the case
          // that matters — someone developing Ness against a real application.
          watch: { ignored: ['!**/node_modules/@nessframework/**'] },
        },
        build: {
          target: 'es2022',
        },
      };
    },
    resolveId(id: string) {
      if (id === 'virtual:ness/config') return '\0virtual:ness/config';
      if (id === PREFETCH_MODULE) return `\0${PREFETCH_MODULE}`;
      if (id === INTERCEPTOR_MODULE) return `\0${INTERCEPTOR_MODULE}`;
      return null;
    },
    async load(id: string) {
      if (id === '\0virtual:ness/config') {
        const absolute = path.resolve(
          options.root || process.cwd(),
          configFile,
        );
        return fs.existsSync(absolute)
          ? `export {default} from ${JSON.stringify(absolute)}; export * from ${JSON.stringify(absolute)};`
          : 'export default {};';
      }
      // The table `prefetchRoute` matches an href against: every page's URL
      // pattern next to a dynamic import of the module that serves it.
      // Generated from the same route discovery that produced the router
      // itself, so adding a page makes it prefetchable with no further step.
      // Imports are dynamic on purpose — naming a route here must not pull it
      // into the initial bundle, only make it reachable on demand.
      if (id === `\0${PREFETCH_MODULE}`) {
        const root = options.root || process.cwd();
        const appDirectory = path.resolve(root, options.appDirectory || 'app');
        const pages = await nessRoutePaths({
          appDirectory,
          i18n: options.i18n,
        });
        const entries = pages
          .map(page => {
            const absolute = path.resolve(appDirectory, page.file);
            return `  {path: ${JSON.stringify(page.path)}, id: ${JSON.stringify(page.id)}, load: () => import(${JSON.stringify(absolute)})}`;
          })
          .join(',\n');
        return `export const routes = [\n${entries}\n];\n`;
      }
      // Intercepting routes: the client runtime reads this table to decide
      // which navigations render an overlay instead of committing. Same
      // discovery as the router itself, so the two cannot disagree.
      if (id === `\0${INTERCEPTOR_MODULE}`) {
        const root = options.root || process.cwd();
        const appDirectory = path.resolve(root, options.appDirectory || 'app');
        const interceptors = fs.existsSync(path.join(appDirectory, 'routes'))
          ? await nessInterceptors({ appDirectory, i18n: options.i18n })
          : [];
        const entries = interceptors
          .map(
            entry =>
              `  {from: ${JSON.stringify(entry.from)}, pattern: ${JSON.stringify(entry.pattern)}, load: () => import(${JSON.stringify(path.resolve(entry.file))})}`,
          )
          .join(',\n');
        return `export const interceptors = [\n${entries}\n];\n`;
      }
      return null;
    },
    transform(_code: string, id: string, context?: { ssr?: boolean }) {
      if (
        !context?.ssr &&
        /(?:^|[\\/])[^\\/]+\.server\.[cm]?[jt]sx?$/.test(id)
      ) {
        this.error(`Server-only module imported by the client bundle: ${id}`);
      }
      return null;
    },
    // Only RSC mode needs this: the non-RSC build gets `ness-manifest.json`
    // from React Router's own `buildEnd` hook (see `writeBuildManifest` in
    // `../index.ts`), which RSC Framework Mode does not support at all.
    buildApp: {
      order: 'post',
      async handler() {
        if (!rsc) return;
        await writeRscManifest({
          root: options.root || process.cwd(),
          appDirectory: options.appDirectory || 'app',
          configFile,
        });
      },
    },
    // The route wrappers under app/.ness/routes are generated when the app's
    // routes.ts runs nessRoutes() — once, at config evaluation. A wrapper
    // snapshots which exports its page.server file had at that moment, so
    // adding (say) an `action` to an existing page.server.ts left the wrapper
    // stale: the route 405'd until the developer guessed a manual restart.
    // Regenerating on every change to a file under app/routes keeps wrappers
    // honest — writeIfChanged makes the frequent no-op case free — and when
    // the route *tree* itself changes shape (a route directory added or
    // removed), the config must be re-evaluated, so the server restarts.
    configureServer(server: ViteDevServer) {
      const root = options.root || server.config.root || process.cwd();
      const appDirectory = resolveAppDirectory(
        root,
        options.appDirectory || 'app',
      );
      // Nothing to regenerate, and nothing worth an error about it: the
      // generated `.ness/config` root gets its own Vite server, and it has no
      // routes of its own by design.
      if (!appDirectory) return;
      const routesDirectory = path.join(appDirectory, 'routes');
      const generatedPrefix = path.join(appDirectory, '.ness') + path.sep;
      const routesPrefix = routesDirectory + path.sep;

      let lastTree: string | undefined;
      let generating: Promise<void> = Promise.resolve();
      const regenerate = () => {
        // Serialized: watcher events can burst (editor save = change+change),
        // and generation reads the tree it also writes.
        generating = generating.then(async () => {
          const tree = await nessRoutes({ appDirectory });
          const snapshot = JSON.stringify(tree);
          if (lastTree !== undefined && snapshot !== lastTree) {
            lastTree = snapshot;
            await server.restart();
            return;
          }
          lastTree = snapshot;
        });
        generating.catch((error: unknown) =>
          server.config.logger.error(
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error),
          ),
        );
        return generating;
      };

      const onChange = (filename: string) => {
        if (!filename.startsWith(routesPrefix)) return;
        if (filename.startsWith(generatedPrefix)) return;
        void regenerate();
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
      // Seed the baseline so the first real change is compared against the
      // tree this server actually booted with.
      void regenerate();
    },
  } as Plugin;
}

function ness(options: NessViteOptions = {}): PluginOption[] {
  const { plugins = [], overlay = {}, rsc = true, ...rest } = options;
  // Normalized here, not just below, so `nessVitePlugin`'s own `options.rsc`
  // checks (the RSC environment config, the manifest-writing `buildApp` hook)
  // see the same default as the RSC-vs-classic plugin choice does — an
  // omitted `rsc` must mean the same thing in both places.
  const frameworkOptions: NessViteOptions = { ...rest, rsc };
  // Flattened through `unknown[]`: PluginOption is recursive, and letting the
  // checker expand it through `flat(Infinity)` exhausts its instantiation depth.
  const integrations = ([plugins] as unknown[])
    .flat(Infinity)
    .filter(Boolean) as PluginOption[];
  // The overlay registers its middleware after Vite's own, so it must come
  // last in the plugin array to be configured last.
  const errorOverlay =
    overlay === false
      ? []
      : [nessErrorOverlay(overlay === true ? {} : overlay)];

  if (frameworkOptions.rsc === false) {
    return [
      nessVitePlugin(frameworkOptions),
      ...reactRouter(),
      ...integrations,
      ...errorOverlay,
    ];
  }
  return [
    nessVitePlugin(frameworkOptions),
    ...unstable_reactRouterRSC(),
    rscPlugin(),
    ...integrations,
    ...errorOverlay,
  ];
}

export { ness, nessErrorOverlay, nessVitePlugin };
export default ness;
