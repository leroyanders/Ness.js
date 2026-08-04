import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';

/**
 * The benchmark measures rendering, so both frameworks must render.
 *
 * The Next fixtures declare `export const dynamic = 'force-dynamic'`, opting
 * out of its Full Route Cache. Ness caches HTML responses by default, so
 * without the policy below it would answer from memory while Next re-renders —
 * comparing a cache read against a React render and calling it SSR throughput.
 *
 * `prerender` is off for the same reason: a prerendered route is a file read.
 */
export default defineNessConfig({
  vite: { plugins: [ness({ plugins: [nest()] })] },
  router: {},
  server: {
    configureServer: nestServer(),
    cachePolicy: () => undefined,
  },
});
