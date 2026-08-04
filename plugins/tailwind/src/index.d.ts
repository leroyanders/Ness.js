import type { Plugin } from 'vite';

export interface TailwindOptions {
  /** Force cssnano on or off. Defaults to on for builds, off for dev. */
  minify?: boolean;
}

export function tailwind(options?: TailwindOptions): Plugin;

export default tailwind;
