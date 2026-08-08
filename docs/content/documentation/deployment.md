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

### Configuration at the edge

A Worker cannot read a file or import a path at runtime, so its configuration has to be compiled in — and `ness.config.mjs` cannot be, because it imports Vite plugins at module scope and that would drag the build toolchain into the Worker.

Keep the runtime half in `ness.server.config.mjs`:

```js title="ness.server.config.mjs"
export default {
  server: {
    trustProxy: true,
    headers: [
      {
        source: '/:path*',
        headers: [{ key: 'x-frame-options', value: 'DENY' }],
      },
    ],
    cache: { adapter: myKvAdapter },
  },
  instrumentation: { onError: reportToSentry },
};
```

`ness bundle cloudflare` finds it and generates an entry that imports it, so the cache adapter, instrumentation, headers and redirects apply at the edge exactly as they do under `ness start`. `ness start` reads the same file, so nothing is duplicated.

Without it the bundler says so rather than deploying a Worker that quietly ignores your settings.

The config is applied on the first request rather than at module scope, because a Worker's startup window is metered and short.

## AWS Lambda

```js
import { createLambdaApplication } from '@nessframework/deployment/lambda';
import * as build from './build/server/index.js';
import config from './ness.server.config.mjs';

export const handler = createLambdaApplication({ build, config });
```

`createLambdaApplication` applies the runtime config the way `ness start` does — the cache adapter, the instrumentation, the headers and the redirects — and honours the scheme API Gateway forwards when `trustProxy` is on.

`createLambdaHandler(fetchHandler)` is still there for a handler you assemble yourself, but it applies no configuration: everything in the `server` section is then yours to wire.

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

## Shutting down

On `SIGTERM` or `SIGINT` the server drains rather than stopping:

1. `/_ness/health` starts reporting `503` with `"status": "draining"`, so the load balancer stops routing here. This happens first, before the socket closes — a balancer needs a poll cycle to notice, and anything it routes in the meantime would be a request the visitor sees fail.
2. The listening socket closes and in-flight requests are allowed to finish.
3. Idle keep-alive sockets are released, repeatedly, as connections fall idle.
4. `configureServer`'s dispose runs — after the drain, because the API layer is still serving those requests until then.

Step 3 is what makes the rest work. `server.close` waits for every connection, and a browser holds a keep-alive socket open long after its last request; without releasing them the close never resolves, the grace period expires, and the orchestrator kills the process along with the in-flight requests the drain was protecting.

The grace period is 10 seconds, from `NESS_SHUTDOWN_TIMEOUT` or `server.shutdownTimeout`. When it runs out the remaining connections are cut and the process exits `1`, so the reason is in the logs rather than an unexplained `SIGKILL`.

Set the orchestrator's own grace period higher than this one, or it will kill the process mid-drain. In Kubernetes that is `terminationGracePeriodSeconds`.

Unhandled rejections and uncaught exceptions are logged and sent to the `onError` instrumentation hook. An uncaught exception then exits `1`, because the process state after one is not worth trusting.
