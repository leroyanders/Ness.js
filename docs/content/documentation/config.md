# Configuration

Ness uses one framework configuration file: `ness.config.mjs`. It contains Vite integrations, React Router options, the production server, and instrumentation hooks.

```js title="ness.config.mjs" showLineNumbers
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';
import security from '@nessframework/security';

const rsc = process.env.NESS_EXPERIMENTAL_RSC === 'true';

export default defineNessConfig({
  vite: {
    plugins: [ness({ rsc, plugins: [nest(), security()] })],
  },
  router: {
    rsc,
    ssr: true,
    prerender: ['/', '/about'],
    allowedActionOrigins: ['app.example.com'],
  },
  server: {
    configureServer: nestServer({ prefix: 'api' }),
    redirects: [
      { source: '/old/:slug', destination: '/blog/:slug', permanent: true },
    ],
    headers: [
      {
        source: '/api/*',
        headers: [{ key: 'cache-control', value: 'no-store' }],
      },
    ],
    images: {
      remotePatterns: [{ protocol: 'https', hostname: 'images.example.com' }],
    },
  },
  instrumentation: {
    async register() {
      // Initialize tracing, metrics, or error reporting.
    },
    onError({ error }) {
      console.error(error);
    },
  },
});
```

## Vite

The `vite` section accepts standard Vite configuration. Official NestJS, Tailwind, security, environment, compression, and analyzer integrations are composed through `ness({ plugins })`. Only `VITE_` and `NESS_PUBLIC_` variables are exposed to browser code.

## Router

The `router` section accepts React Router Framework Mode options. Ness supplies ESM server bundles, route-module splitting, subresource integrity, lazy route discovery, streaming SSR, and the `build/` directory by default.

## Production server

The `server` section is loaded by `ness start`. It supports the NestJS bridge, redirects, rewrites, response headers, image policy, middleware, and cache adapters.

## Instrumentation

The `instrumentation` section receives application lifecycle and error hooks without requiring another root file.

The CLI generates React Router's compatibility adapter under `.ness/config`; it is build output and must not be committed. TypeScript applications still keep `tsconfig.json`, and Docker deployments keep `Dockerfile`, because those files are read directly by their respective external tools.
