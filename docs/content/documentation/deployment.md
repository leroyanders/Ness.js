# Deployment and observability

Build and run the application on any Node.js host:

```bash
npm run build
npm run start:prod
```

The starter Dockerfile uses the same commands. Set `HOST`, `PORT`, and server-only environment variables at runtime.

`@nessframework/deployment` exposes Node/Express listeners, serverless functions, Edge `fetch` adapters, health checks, and graceful shutdown. Applications targeting Edge must avoid Node-only dependencies such as the built-in Sharp image optimizer and in-memory Node cache.

## Instrumentation

Add instrumentation to `ness.config.mjs`:

```js
import { defineNessConfig } from '@nessframework/router';

export default defineNessConfig({
  instrumentation: {
    register() {
      // Initialize OpenTelemetry or an error SDK.
    },
    onRequest({ request, id }) {},
    onResponse({ response, duration, id }) {},
    onError({ error, id }) {},
  },
});
```

The production server loads it once. Use `reportWebVitals` or `useReportWebVitals` for FCP, LCP, CLS, INP, and TTFB. `/_ness/health` reports runtime and cache health.
