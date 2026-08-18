import path from 'node:path';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import fs from 'fs-extra';
import type { Plugin, ViteDevServer } from 'vite';
import { buildNestApplication } from './compiler.js';
import { createNestMiddleware } from './server.js';
import type { NestHandler, NestMiddleware } from './server.js';

export interface NestOptions {
  root?: string;
  source?: string;
  outDir?: string;
  prefix?: string;
  logger?: Array<'error' | 'warn' | 'log' | 'debug' | 'verbose' | 'fatal'>;
}

type UpgradeHandler = (
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
) => void;

/** Read through a cast rather than an ambient `var`: see serve.ts in core. */
function webSocketUpgrade(): UpgradeHandler | undefined {
  return (globalThis as { __nessWebSocketUpgrade?: UpgradeHandler })
    .__nessWebSocketUpgrade;
}

function isServerModule(filename: string, root: string): boolean {
  const relative = path.relative(path.join(root, 'app', 'server'), filename);
  return Boolean(
    relative && !relative.startsWith('..') && !path.isAbsolute(relative),
  );
}

export function nest(options: NestOptions = {}): Plugin {
  let productionBuild: Promise<string | null> | undefined;
  let buildLogged = false;
  return {
    name: 'ness:nest',
    enforce: 'pre',
    async configureServer(server: ViteDevServer) {
      const root =
        options.root ||
        process.env['NESS_ROOT'] ||
        server.config.root ||
        process.cwd();
      let active: NestMiddleware | undefined;
      let middleware: NestHandler = (_request, _response, next) => next();
      let version = 0;
      server.middlewares.use((request, response, next) =>
        middleware(request, response, next),
      );

      // WebSocket bridge: the application registers a handler on
      // `globalThis.__nessWebSocketUpgrade` (matching only its own paths), so
      // vite's HMR upgrade listener keeps working untouched.
      const onUpgrade: UpgradeHandler = (request, socket, head) => {
        const handle = webSocketUpgrade();
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
      const onChange = (filename: string) => {
        if (!isServerModule(filename, root)) return;
        reload().catch((error: unknown) =>
          server.config.logger.error(
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error),
          ),
        );
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
      server.httpServer?.once('close', () => {
        void active?.application.close();
      });
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
export type { NestHandler, NestMiddleware } from './server.js';
export default nest;
