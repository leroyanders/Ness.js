# Deployment and observability

## Standalone output

`ness bundle node` traces the production dependency graph and writes a self-contained directory:

```bash
ness build
ness bundle node
node build/standalone/server.mjs
```

`build/standalone` contains the server build, the client assets, `public/`, your `ness.config.mjs`, and only the packages actually reachable from your `dependencies`. It runs on a bare Node image with no install step, no lockfile, and no registry access.

Tracing is at package granularity rather than file granularity. The output is a few percent larger than a file-level tracer would produce, and in exchange it never drops a file reached through a runtime `require`, a dynamic import, or a native binding.

Anything in `devDependencies` is excluded — that is where most of the size lives. Keep Vite, `@react-router/dev`, and TypeScript there; new applications are scaffolded that way.

If a package is loaded by a name nothing declares, name it explicitly:

```js title="ness.config.mjs"
export default defineNessConfig({
  router: {
    deployment: { extraPackages: ['my-runtime-plugin'] },
  },
});
```

Standalone bundling is unavailable in RSC mode, which does not emit the build manifest it reads.

### Docker

The generated `Dockerfile` builds and bundles in one stage and copies only the bundle into the runtime stage:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && npx ness bundle node

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
COPY --from=build --chown=node:node /app/build/standalone ./
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
```

`CMD` is an exec-form array so the process receives `SIGTERM` directly; the server then closes connections and exits within its shutdown timeout.

## Node and Express

`ness start` runs the Ness server directly. To mount it inside an existing Express application, use `nodeAdapter` or `expressAdapter` from `@nessframework/deployment`, and `gracefulShutdown` to drain connections on a signal.

`configureServer` in `ness.config.mjs` is the supported hook for adding middleware — that is how the NestJS integration mounts itself.

## Cloudflare Workers

```bash
ness build
ness bundle cloudflare
npx wrangler deploy
```

`ness bundle cloudflare` writes `build/worker/index.js` and a `wrangler.json` pointing at it. Static files are served by the Workers assets binding, so they are answered from the edge cache without invoking the Worker.

`nodejs_compat` is required and is set for you: the framework uses `node:async_hooks` for request-scoped caching and `node:crypto` for cache keys.

Two capabilities do not exist on this runtime:

- **Image optimization** needs `sharp`, a native module. Use Cloudflare Images instead.
- **The filesystem and SQLite cache adapters** need a filesystem. Use a KV- or Durable-Object-backed adapter.

## AWS Lambda

```js
import { createLambdaHandler } from '@nessframework/deployment/lambda';
import { createNessRequestHandler } from '@nessframework/server';
import * as build from './build/server/index.js';

export const handler = createLambdaHandler(createNessRequestHandler({ build }));
```

API Gateway v2 and Function URL payloads are supported. v1 (REST API) is not.

Responses are buffered, because that is the only shape API Gateway accepts. Streaming SSR still renders correctly, but the client receives it in one piece — deploy to a Node or container target if time-to-first-byte matters.

## Other edge runtimes

`edgeAdapter(handler)` shapes a handler as an edge module export for runtimes that already speak `Request`/`Response`, such as Deno Deploy and Netlify Edge. For Cloudflare prefer `@nessframework/deployment/cloudflare`, which also wires the assets binding.

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

The production server loads it once. Use `reportWebVitals` or `useReportWebVitals` for FCP, LCP, CLS, INP, and TTFB.

## Health checks

`/_ness/health` reports the framework status and the active cache adapter. For dependency checks:

```js
import { createHealthHandler } from '@nessframework/deployment';

const health = createHealthHandler({ checks: [pingDatabase, pingRedis] });
```

It returns 503 when any check fails, so an orchestrator can take the instance out of rotation.
