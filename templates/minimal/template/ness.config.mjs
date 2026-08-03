import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';

const rsc = process.env.NESS_EXPERIMENTAL_RSC === 'true';

export default defineNessConfig({
  vite: { plugins: [ness({ rsc, plugins: [nest()] })] },
  router: { rsc, prerender: ['/'] },
  server: { configureServer: nestServer() },
  instrumentation: {
    async register() {},
    onError({ error }) {
      console.error(error);
    },
  },
});
