import analyzer from '@nessframework/analyzer';
import compression from '@nessframework/compression';
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';
import security from '@nessframework/security';

const rsc = process.env.NESS_EXPERIMENTAL_RSC === 'true';

export default defineNessConfig({
  vite: {
    plugins: [
      ness({
        rsc,
        plugins: [
          nest(),
          security(),
          compression({ threshold: 1_024 }),
          analyzer({ html: false }),
        ],
      }),
    ],
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
          {
            key: 'permissions-policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ],
  },
  instrumentation: {
    async register() {
      // Initialize tracing, metrics, or error reporting here.
    },
    onError({ error }) {
      console.error('[welcome]', error);
    },
  },
});
