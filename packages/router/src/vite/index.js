import fs from 'node:fs';
import path from 'node:path';
import { reactRouter, unstable_reactRouterRSC } from '@react-router/dev/vite';
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
