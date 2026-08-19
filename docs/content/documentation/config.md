# Configuration

Ness uses one framework configuration file: `ness.config.mjs`. It contains Vite integrations, React Router options, the production server, and instrumentation hooks.

```js title="ness.config.mjs" showLineNumbers
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';
import security from '@nessframework/security';

export default defineNessConfig({
  vite: {
    plugins: [ness({ rsc: true, plugins: [nest(), security()] })],
  },
  router: {
    rsc: true,
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

`rsc` defaults to `true` — a project scaffolded with `ness new --no-rsc` sets it to `false` instead, which switches to React Router's classic (non-RSC) plugin. `prerender` works the same either way.

`basePath` serves the whole application under a path prefix — routing, links, built assets, the image endpoint and the production server's static mounts all move together. `assetPrefix` points built assets at a CDN origin in production builds while routing keeps following `basePath`. See [Next.js parity](./next-parity.md#basepath-and-assetprefix).

`clientCache` sets the application-wide default for how many seconds a client-side navigation may reuse a page's data from memory instead of refetching its loader. A page's own `export const clientCache = N` overrides it, and `clientCache = 0` opts that page back out. See [the client cache](./router.md#client-cache).

## Production server

The `server` section is loaded by `ness start`. It supports the NestJS bridge, redirects, rewrites, response headers, image policy, middleware, cache adapters, and multi-zone composition via `zones` — path prefixes proxied to other deployments ([details](./next-parity.md#multi-zones)).

It is not only `ness start` that reads it. The Worker entry `ness bundle cloudflare` generates, and `createLambdaApplication` from `@nessframework/deployment/lambda`, go through the same resolution, so the cache adapter, the instrumentation, the headers and the redirects behave the same on all three. Neither of those two can import `ness.config.mjs` — it pulls in Vite plugins at module scope — so put the runtime half in `ness.server.config.mjs`. `ness start` falls back to that file only when the project has no `ness.config.mjs` — it reads the first of the two that exists and merges nothing — so a project with both keeps its `server` and `instrumentation` sections in `ness.config.mjs` and duplicates them in the runtime-only file for the edge targets. See [Configuration at the edge](./deployment.md#configuration-at-the-edge).

```js title="ness.config.mjs"
export default defineNessConfig({
  server: {
    trustProxy: true,
    shutdownTimeout: 15_000,
    compression: { threshold: 1024 },
  },
});
```

### `trustProxy`

Off by default. Turn it on when something in front terminates TLS.

Almost every production deployment terminates TLS at a load balancer and forwards plaintext, so the URL the server sees is `http://` on an internal name. Everything derived from it is then wrong: redirects downgrade the visitor to HTTP, canonical links and `og:url` point somewhere unreachable, and an OAuth callback fails a strict redirect-URI check.

With it on, `X-Forwarded-Proto` and `X-Forwarded-Host` are applied to `request.url` before the request is handled, so every loader, redirect and generated link sees the address the visitor actually used.

It is off by default because those headers come from the client unless a proxy overwrites them. On a directly exposed server, trusting them lets anyone rewrite the host the application believes it is serving — which is where cache poisoning and forged password-reset links start. Only the first value of each header is read, so a chain of proxies still yields the connection closest to the visitor, and a scheme that is not `http`/`https` or a host that does not parse is ignored.

A forwarded host without a port drops the internal one rather than inheriting it, so an internal `:8080` never reaches a link the visitor sees.

`X-Forwarded-For` is not consumed: the framework has no client-address concept to put it in. Read it from `request.headers` where you need it.

### `shutdownTimeout`

How long in-flight requests get on `SIGTERM`, in milliseconds. Defaults to 10 000, and `NESS_SHUTDOWN_TIMEOUT` overrides it. See [Shutting down](./deployment.md#shutting-down).

### `compression`

On by default. A response with a compressible content type is encoded with Brotli or gzip according to the request's `Accept-Encoding`, and `Vary: Accept-Encoding` is appended so a shared cache keeps the encodings apart. `threshold` is the smallest body worth encoding, 1024 bytes by default; a response that already carries `Content-Encoding`, or whose `Cache-Control` says `no-transform`, is left alone.

`compression: false` turns it off. That also stops `ness start` serving the `.br` and `.gz` twins the compression plugin writes next to build assets, so a static file is then sent uncompressed too.

## Instrumentation

The `instrumentation` section receives application lifecycle and error hooks without requiring another root file.

The CLI generates React Router's compatibility adapter under `.ness/config`; it is build output and must not be committed. TypeScript applications still keep `tsconfig.json`, and Docker deployments keep `Dockerfile`, because those files are read directly by their respective external tools.
