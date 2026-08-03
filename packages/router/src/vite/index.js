import fs from 'node:fs';
import path from 'node:path';
import rsc from '@vitejs/plugin-rsc';
import { reactRouter, unstable_reactRouterRSC } from '@react-router/dev/vite';

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
  const { plugins = [], ...frameworkOptions } = options;
  const integrations = [plugins].flat(Infinity).filter(Boolean);
  if (!frameworkOptions.rsc) {
    return [
      nessVitePlugin(frameworkOptions),
      ...reactRouter(),
      ...integrations,
    ];
  }
  return [
    nessVitePlugin(frameworkOptions),
    ...unstable_reactRouterRSC(),
    rsc(),
    ...integrations,
  ];
}

export { ness, nessVitePlugin };
export default ness;
