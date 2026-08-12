import fs from 'node:fs';
import path from 'node:path';
import { reactRouter, unstable_reactRouterRSC } from '@react-router/dev/vite';
import { nessRoutes } from '../routes.js';
import { nessErrorOverlay } from './overlay.js';

/**
 * `@vitejs/plugin-rsc` is an optional peer: only RSC applications install it.
 * Vite accepts a promise in the plugin array, so importing it lazily keeps a
 * non-RSC build from failing on a package it never needed.
 */
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

function nessVitePlugin(options = {}) {
  const configFile = options.configFile || 'ness.config.mjs';
  return {
    name: 'ness:framework',
    enforce: 'pre',
    config() {
      return {
        envPrefix: ['VITE_', 'NESS_PUBLIC_'],
        ...(options.rsc
          ? {
              ssr: { noExternal: ['react-router'] },
              environments: {
                rsc: { resolve: { noExternal: ['react-router'] } },
                ssr: { resolve: { noExternal: ['react-router'] } },
              },
            }
          : {}),
        server: {
          headers: { 'x-powered-by': 'Ness.js' },
        },
        build: {
          target: 'es2022',
        },
      };
    },
    resolveId(id) {
      if (id === 'virtual:ness/config') return '\0virtual:ness/config';
      return null;
    },
    load(id) {
      if (id !== '\0virtual:ness/config') return null;
      const absolute = path.resolve(options.root || process.cwd(), configFile);
      return fs.existsSync(absolute)
        ? `export {default} from ${JSON.stringify(absolute)}; export * from ${JSON.stringify(absolute)};`
        : 'export default {};';
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
  const { plugins = [], overlay = {}, ...frameworkOptions } = options;
  const integrations = [plugins].flat(Infinity).filter(Boolean);
  // The overlay registers its middleware after Vite's own, so it must come
  // last in the plugin array to be configured last.
  const errorOverlay =
    overlay === false
      ? []
      : [nessErrorOverlay(overlay === true ? {} : overlay)];

  if (!frameworkOptions.rsc) {
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
