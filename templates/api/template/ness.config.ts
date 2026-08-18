import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';

export default defineNessConfig({
  vite: { plugins: [ness({ rsc: true, plugins: [nest()] })] },
  router: { rsc: true, prerender: ['/'] },
  server: { configureServer: nestServer() },
  instrumentation: {
    async register() {
      // Configure tracing or structured logging here.
    },
    onError({ error }) {
      console.error(error);
    },
  },
});
