import { defineNessConfig } from '@ness/router';
import { ness } from '@ness/router/vite';
import nest from '@ness/nest';
import { nestServer } from '@ness/nest/server';

const rsc = process.env.NESS_EXPERIMENTAL_RSC === 'true';

export default defineNessConfig({
  vite: {
    plugins: [ness({ rsc, plugins: [nest()] })],
  },
  router: {
    rsc,
    prerender: ['/'],
  },
  server: {
    configureServer: nestServer(),
    images: { remotePatterns: [] },
    headers: [
      {
        source: '*',
        headers: [
          { key: 'x-content-type-options', value: 'nosniff' },
          { key: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ],
  },
  instrumentation: {
    async register() {
      // Initialize tracing, metrics, or error reporting here.
    },
    onError({ error }) {
      console.error(error);
    },
  },
});
