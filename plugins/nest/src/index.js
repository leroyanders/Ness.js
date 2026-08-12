import path from 'node:path';
import fs from 'fs-extra';
import { buildNestApplication } from './compiler.js';
import { createNestMiddleware } from './server.js';

function isServerModule(filename, root) {
  const relative = path.relative(path.join(root, 'app', 'server'), filename);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function nest(options = {}) {
  let productionBuild;
  let buildLogged = false;
  return {
    name: 'ness:nest',
    enforce: 'pre',
    async configureServer(server) {
      const root =
        options.root ||
        process.env.NESS_ROOT ||
        server.config.root ||
        process.cwd();
      let active;
      let middleware = (_request, _response, next) => next();
      let version = 0;
      server.middlewares.use((request, response, next) =>
        middleware(request, response, next),
      );

      // WebSocket bridge: the application registers a handler on
      // `globalThis.__nessWebSocketUpgrade` (matching only its own paths), so
      // vite's HMR upgrade listener keeps working untouched.
      const onUpgrade = (request, socket, head) => {
        const handle = globalThis.__nessWebSocketUpgrade;
        if (typeof handle === 'function') handle(request, socket, head);
      };
      server.httpServer?.on('upgrade', onUpgrade);
      server.httpServer?.once('close', () =>
        server.httpServer?.off('upgrade', onUpgrade),
      );

      const reload = async () => {
        const currentVersion = ++version;
        const outDir = path.join('.ness', 'nest', `dev-${currentVersion}`);
        const entry = await buildNestApplication({
          root,
          outDir,
          clean: true,
          source: options.source,
        });
        if (!entry || currentVersion !== version) return;
        const next = await createNestMiddleware({
          modulePath: entry,
          prefix: options.prefix,
          logger: options.logger,
        });
        if (currentVersion !== version) {
          await next.application.close();
          return;
        }
        const previous = active;
        active = next;
        middleware = next.handler;
        await previous?.application.close();
      };

      await reload();
      const onChange = filename => {
        if (!isServerModule(filename, root)) return;
        reload().catch(error => server.config.logger.error(error.stack));
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
      server.httpServer?.once('close', () => active?.application.close());
    },
    async closeBundle() {
      if (!productionBuild) {
        productionBuild = buildNestApplication({
          root: options.root || process.cwd(),
          source: options.source,
          outDir: options.outDir || 'build/nest',
        });
      }
      const entry = await productionBuild;
      if (entry && fs.existsSync(entry) && !buildLogged) {
        buildLogged = true;
        console.log(`[ness:nest] ${path.relative(process.cwd(), entry)}`);
      }
    },
  };
}

export { buildNestApplication, createNestMiddleware };
export default nest;
