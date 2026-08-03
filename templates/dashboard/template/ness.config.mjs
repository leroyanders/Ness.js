import { defineNessConfig } from '@ness/router';
import { ness } from '@ness/router/vite';
import nest from '@ness/nest';
import { nestServer } from '@ness/nest/server';

const rsc = process.env.NESS_EXPERIMENTAL_RSC === 'true';

export default defineNessConfig({
  vite: { plugins: [ness({ rsc, plugins: [nest()] })] },
  router: { rsc, prerender: ['/'] },
  server: {
    configureServer: nestServer(),
    headers: [
      {
        source: '*',
        headers: [{ key: 'x-content-type-options', value: 'nosniff' }],
      },
    ],
  },
  instrumentation: {
    async register() {},
    onError({ error }) {
      console.error(error);
    },
  },
});
