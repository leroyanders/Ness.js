import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { reactRouter, unstable_reactRouterRSC } from '@react-router/dev/vite';
import { buildManifestPayload, writeNessManifest } from '../index.js';
import { nessRoutePaths, nessRoutes } from '../routes.js';
import { nessErrorOverlay } from './overlay.js';

/**
 * `@vitejs/plugin-rsc` is an optional peer: only RSC applications install it.
 * Vite accepts a promise in the plugin array, so importing it lazily keeps a
 * non-RSC build from failing on a package it never needed.
 */
const PREFETCH_MODULE = 'virtual:ness/route-prefetch';

function rscPlugin() {
  return import('@vitejs/plugin-rsc').then(
    module => (module.default || module)(),
    () => {
      throw new Error(
        'RSC mode requires @vitejs/plugin-rsc. Install it with: npm install -D @vitejs/plugin-rsc',
      );
    },
  );
}

/**
 * `nessRoutes()` returns a tree (routes nest `children`); `ness-manifest.json`
 * records a flat, id-keyed map instead, matching the shape a React-Router
 * `buildEnd` hook would have handed `writeBuildManifest` in non-RSC mode.
 */
function flattenRouteTree(routes, parentId, manifest = {}) {
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
 * writes it (see `writeBuildManifest` in `../index.js`). This writes the same
 * manifest shape from a plugin-level `buildApp` hook instead — a hook Vite's
 * Builder API calls once after every environment (client/rsc/ssr) finishes,
 * independent of React Router's own `buildEnd` wiring. Route data comes from
 * Ness's own `nessRoutes()` rather than React Router's `buildManifest`, since
 * RSC mode never produces one.
 */
async function writeRscManifest({ root, appDirectory, configFile }) {
  const absoluteConfigFile = path.resolve(root, configFile);
  if (!fs.existsSync(absoluteConfigFile)) return;
  const imported = await import(
    /* @vite-ignore */ pathToFileURL(absoluteConfigFile).href
  );
  const config = imported.default || imported;
  const routerOptions = config?.ness?.router || {};
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
      basename: routerOptions.basename || '/',
      routes: flattenRouteTree(routes),
      pages: await nessRoutePaths({
        appDirectory: absoluteAppDirectory,
        i18n: routerOptions.i18n,
      }),
      cache: routerOptions.cache,
      deployment: routerOptions.deployment,
      i18n: routerOptions.i18n,
    }),
  );
}

function nessVitePlugin(options = {}) {
  const configFile = options.configFile || 'ness.config.mjs';
  // Defaults to RSC when called directly (not just through `ness()`), so a
  // bare `nessVitePlugin()` and a bare `ness()` agree on what "no `rsc`
  // option given" means.
  const rsc = options.rsc !== false;
  return {
    name: 'ness:framework',
    enforce: 'pre',
    config() {
      return {
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
    resolveId(id) {
      if (id === 'virtual:ness/config') return '\0virtual:ness/config';
      if (id === PREFETCH_MODULE) return `\0${PREFETCH_MODULE}`;
      return null;
    },
    async load(id) {
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
      return null;
    },
    transform(_code, id, context) {
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
    // `../index.js`), which RSC Framework Mode does not support at all.
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
    configureServer(server) {
      const root = options.root || server.config.root || process.cwd();
      const appDirectory = path.resolve(root, options.appDirectory || 'app');
      const routesDirectory = path.join(appDirectory, 'routes');
      const generatedPrefix = path.join(appDirectory, '.ness') + path.sep;
      const routesPrefix = routesDirectory + path.sep;

      let lastTree;
      let generating = Promise.resolve();
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
        generating.catch(error => server.config.logger.error(error.stack));
        return generating;
      };

      const onChange = filename => {
        if (!filename.startsWith(routesPrefix)) return;
        if (filename.startsWith(generatedPrefix)) return;
        regenerate();
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
      // Seed the baseline so the first real change is compared against the
      // tree this server actually booted with.
      regenerate();
    },
  };
}

function ness(options = {}) {
  const { plugins = [], overlay = {}, rsc = true, ...rest } = options;
  // Normalized here, not just below, so `nessVitePlugin`'s own `options.rsc`
  // checks (the RSC environment config, the manifest-writing `buildApp` hook)
  // see the same default as the RSC-vs-classic plugin choice does — an
  // omitted `rsc` must mean the same thing in both places.
  const frameworkOptions = { ...rest, rsc };
  const integrations = [plugins].flat(Infinity).filter(Boolean);
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
