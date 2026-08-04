# Ness.js

Ness.js is a full-stack React framework with a NestJS backend. Version 7 combines React 19, React Router Framework Mode, Vite 8, NestJS controllers and DI, streaming SSR, typed loaders and actions, caching shared across instances, localized routing, pre-rendering, image optimization, and self-hosted deployment that ships as a single directory.

## Create an application

Node.js 20.19 or newer is required.

```bash
npx @nessframework/cli@latest new my-app
cd my-app
npm run dev
```

Use the TypeScript template:

```bash
ness new my-app --template typescript
```

Other official starters:

```bash
ness new tiny-app --template minimal
ness new backend-app --template api
ness new admin-app --template dashboard
```

Use a local template directory:

```bash
ness new my-app --template ./templates/company-app
```

Experimental React Server Components and Server Functions are opt-in:

```bash
ness new my-app --template typescript --rsc
```

Vite, React Router, Nest production mounting, RSC, and instrumentation are configured together in `ness.config.mjs`. TypeScript and Docker retain their native `tsconfig.json` and `Dockerfile` entrypoints.

## Route conventions

```text
app/
├── root.tsx
├── routes.ts
├── routes/
│   ├── page.tsx
│   ├── page.server.ts
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── blog/[slug]/page.tsx
└── server/
    ├── app.module.ts
    └── health/health.controller.ts
```

- `page` renders UI; an adjacent `page.server` can export `loader`, `action`, and cache-aware server code.
- `layout`, `loading`, `error`, `not-found`, `forbidden`, and `unauthorized` create nested route boundaries.
- NestJS controllers under `app/server` provide public APIs with modules, providers, guards, pipes, and DI.
- Low-level `route` modules remain available for Web-standard and runtime-specific endpoints.
- `[id]`, `[...parts]`, `[[...parts]]`, route groups such as `(marketing)`, and private `_folders` are supported.
- `middleware` runs around loaders, actions, and rendering for its route segment.

```tsx
// app/routes/products/page.server.ts
import { cached } from '@nessframework/cache';

const getProducts = cached(() => db.product.findMany(), {
  key: 'products',
  life: 'minutes',
  tags: ['products'],
});

export async function loader() {
  return getProducts();
}
```

## Production features

- NestJS controllers, providers, modules, guards, interceptors, pipes, and dependency injection
- Streaming SSR, hydration, nested pending UI, error recovery, and automatic route code splitting
- SSG/prerender plus stale-while-revalidate page caching and tag/path invalidation
- Shared caching across instances: filesystem, SQLite, and Redis adapters, with an optional in-process tier and cross-instance invalidation
- Locale-prefixed routing with `Accept-Language` negotiation
- Metadata helpers for SEO, Open Graph, Twitter, manifests, robots, and sitemaps
- Responsive `<Image>`, AVIF/WebP optimization, local fonts, and script loading strategies
- Redirects, rewrites, response headers, route/global middleware, cookies, status helpers, and Web standard APIs
- `ness bundle node` — a self-contained deployment directory with a traced `node_modules` and no install step
- Cloudflare Workers and AWS Lambda adapters; Docker templates built on the standalone output; graceful shutdown
- A development error overlay with source-mapped stack frames, a code frame, and editor links
- Instrumentation hooks, Core Web Vitals, health checks, route type generation, and test utilities

Every template is scaffolded, built, served, bundled, and served again from the bundle on each commit — see `.github/workflows/ci.yml` and `scripts/e2e/smoke.mjs`.

## Performance

Measured against Next.js on the same application, both self-hosted on Node, both rendering every request. Reproduce with `node scripts/bench/run.mjs`.

|                      | Ness.js         | Next.js     |             |
| -------------------- | --------------- | ----------- | ----------- |
| List page (SSR)      | **2361 req/s**  | 1256 req/s  | 1.9×        |
| Detail page (SSR)    | **3657 req/s**  | 1636 req/s  | 2.2×        |
| JSON endpoint        | **10129 req/s** | 6396 req/s  | 1.6×        |
| Build time           | **1.8 s**       | 4.9 s       | 2.7× faster |
| Client assets        | **312 KB**      | 560 KB      | 44% smaller |
| `node_modules` (dev) | **163.7 MB**    | 330.8 MB    | 51% smaller |
| Cold start           | 541 ms          | **192 ms**  | 2.8× slower |
| Deployable output    | 67.2 MB         | **43.2 MB** | 1.6× larger |

Ness is behind on cold start and bundle size; both rows are explained in [the performance docs](https://nessjs.com/docs/documentation/performance) rather than omitted. Absolute values depend on the machine — compare the columns of one run, not numbers across runs.

React Server Components stay behind `--rsc`. The pipeline builds and serves, and is covered by the same end-to-end suite, but it sits on two pre-stable upstream APIs (`@vitejs/plugin-rsc` 0.x and React Router's `unstable_reactRouterRSC`), and prerendering and standalone bundling are unavailable in that mode.

## CLI

```text
ness new <app>          Create an application
ness dev                Start development with HMR
ness build              Build client and server bundles
ness start              Run the Ness production server
ness bundle node        Package a self-contained deployment directory
ness bundle cloudflare  Package a Cloudflare Worker
ness migrate next       Migrate a Next.js App Router project
ness typegen            Generate route types
ness routes --json      Inspect the route tree
ness g page blog/[slug] Generate a route module
ness g service users    Generate a server service
ness g controller users Generate and register a Nest controller
ness add tailwind       Install @nessframework/tailwind
ness update             Update installed @nessframework packages
ness clean              Remove generated output
ness doctor             Diagnose an application
```

## Packages

- `@nessframework/core` — client runtime and umbrella exports
- `@nessframework/router` — unified configuration, file routing, i18n, and Vite integration
- `@nessframework/server` — Web request handler, middleware, redirects, rewrites, and responses
- `@nessframework/cache` — cache profiles, SWR, tags, and memory, filesystem, SQLite, and Redis adapters
- `@nessframework/assets` — optimized images, fonts, scripts, and metadata
- `@nessframework/instrumentation` — lifecycle hooks and Core Web Vitals
- `@nessframework/deployment` — standalone output, dependency tracing, and Node, Lambda, and Cloudflare Workers adapters
- `@nessframework/testing` — route, request, cache, and response test helpers
- `@nessframework/cli` — the `ness` command
- `@nessframework/default` — JavaScript starter
- `@nessframework/typescript` — strict TypeScript starter
- `@nessframework/minimal` — compact TypeScript starter
- `@nessframework/api` — NestJS API-first starter with a users resource
- `@nessframework/dashboard` — dashboard UI with NestJS metrics endpoints
- `@nessframework/nest` — NestJS server routes, compiler, and production bridge
- `@nessframework/tailwind` — Tailwind CSS 4 integration
- `@nessframework/security` — secure development and preview headers
- `@nessframework/env` — environment validation
- `@nessframework/compression` — Gzip and Brotli build assets
- `@nessframework/analyzer` — bundle reports and size budgets

There is one build pipeline: Vite. The Webpack-based runtime was removed in v7 — its build tooling was declared as runtime dependencies, which put Webpack, Babel, and TypeScript into every deployment.

## Repository layout

```text
packages/
├── assets/        # @nessframework/assets optimized assets and metadata
├── cache/         # @nessframework/cache caching primitives
├── cli/           # @nessframework/cli commands and generators
├── core/          # @nessframework/core client runtime and umbrella exports
├── deployment/    # @nessframework/deployment runtime adapters
├── instrumentation/ # @nessframework/instrumentation lifecycle hooks
├── router/        # @nessframework/router file routing and Vite integration
├── server/        # @nessframework/server request runtime
└── testing/       # @nessframework/testing test utilities
plugins/
├── analyzer/      # Bundle reports and budgets
├── compression/   # Gzip and Brotli assets
├── env/           # Environment validation
├── nest/          # NestJS backend integration
├── security/      # Secure server headers
└── tailwind/      # Tailwind CSS integration
templates/
├── default/       # @nessframework/default JavaScript starter
├── typescript/    # @nessframework/typescript starter
├── minimal/       # @nessframework/minimal compact starter
├── api/           # @nessframework/api API-first starter
└── dashboard/     # @nessframework/dashboard admin starter
examples/
└── welcome/       # End-to-end framework example
docs/
├── content/       # Documentation source
├── src/           # Documentation UI and theme
└── static/        # Documentation assets
```

## Documentation and license

Documentation lives in [`docs/content`](./docs/content). Ness.js is available under the [MIT license](./LICENSE.md).
