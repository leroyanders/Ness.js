import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';

export default defineNessConfig({
  vite: {
    plugins: [ness({ rsc: true, plugins: [nest()] })],
  },
  router: {
    rsc: true,
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
