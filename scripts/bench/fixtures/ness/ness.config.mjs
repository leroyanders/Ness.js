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
 *
 * `rsc` is pinned to `false` (RSC is the framework default otherwise) so this
 * fixture keeps measuring the same classic SSR pipeline run over run; RSC
 * adds its own serialization step and would need its own dedicated benchmark
 * rather than silently changing what this one has been measuring.
 */
export default defineNessConfig({
  vite: { plugins: [ness({ rsc: false, plugins: [nest()] })] },
  router: { rsc: false },
  server: {
    configureServer: nestServer(),
    cachePolicy: () => undefined,
  },
});
