import type { Plugin } from 'vite';

export interface TailwindOptions {
  minify?: boolean;
}

export function tailwind(options?: TailwindOptions): Plugin;
export function install(config: object, options?: { dev?: boolean }): object;

declare const legacyPlugin: {
  install: typeof install;
  vite: typeof tailwind;
};

export default legacyPlugin;
