# Ness.js

Ness.js is a full-stack React framework with a NestJS backend. Version 6 combines React 19, React Router Framework Mode, Vite 8, NestJS controllers and DI, streaming SSR, typed loaders and actions, caching, prerendering, image optimization, and self-hosted deployment.

## Create an application

Node.js 16 or newer is required.

```bash
npx @ness/cli@latest new my-app
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
import { cached } from '@ness/cache';

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
- Metadata helpers for SEO, Open Graph, Twitter, manifests, robots, and sitemaps
- Responsive `<Image>`, AVIF/WebP optimization, local fonts, and script loading strategies
- Redirects, rewrites, response headers, route/global middleware, cookies, status helpers, and Web standard APIs
- Node, Express, serverless, and Edge adapters; Docker-ready templates and graceful shutdown
- Instrumentation hooks, Core Web Vitals, health checks, route type generation, and test utilities

## CLI

```text
ness new <app>          Create an application
ness dev                Start development with HMR
ness build              Build client and server bundles
ness start              Run the Ness production server
ness typegen            Generate route types
ness routes --json      Inspect the route tree
ness g page blog/[slug] Generate a route module
ness g service users    Generate a server service
ness g controller users Generate and register a Nest controller
ness add tailwind       Install @ness/tailwind
ness update             Update installed @ness packages
ness clean              Remove generated output
ness doctor             Diagnose an application
```

## Packages

- `@ness/core` — client runtime and backward-compatible umbrella exports
- `@ness/router` — unified configuration, file routing, and Vite integration
- `@ness/server` — Web request handler, middleware, redirects, rewrites, and responses
- `@ness/cache` — cache profiles, SWR, deduplication, tags, and path invalidation
- `@ness/assets` — optimized images, fonts, scripts, and metadata
- `@ness/instrumentation` — lifecycle hooks and Core Web Vitals
- `@ness/deployment` — Node, Express, serverless, and Edge adapters
- `@ness/testing` — route, request, cache, and response test helpers
- `@ness/cli` — the `ness` command
- `@ness/default` — JavaScript starter
- `@ness/typescript` — strict TypeScript starter
- `@ness/minimal` — compact TypeScript starter
- `@ness/api` — NestJS API-first starter with a users resource
- `@ness/dashboard` — dashboard UI with NestJS metrics endpoints
- `@ness/nest` — NestJS server routes, compiler, and production bridge
- `@ness/tailwind` — Tailwind CSS 4 integration
- `@ness/security` — secure development and preview headers
- `@ness/env` — environment validation
- `@ness/compression` — Gzip and Brotli build assets
- `@ness/analyzer` — bundle reports and size budgets

The Webpack-based v5 runtime remains in `@ness/core` for migration compatibility, while new applications use the v6 Vite architecture.

## Repository layout

```text
packages/
├── assets/        # @ness/assets optimized assets and metadata
├── cache/         # @ness/cache caching primitives
├── cli/           # @ness/cli commands and generators
├── core/          # @ness/core client runtime and compatibility facade
├── deployment/    # @ness/deployment runtime adapters
├── instrumentation/ # @ness/instrumentation lifecycle hooks
├── router/        # @ness/router file routing and Vite integration
├── server/        # @ness/server request runtime
└── testing/       # @ness/testing test utilities
plugins/
├── analyzer/      # Bundle reports and budgets
├── compression/   # Gzip and Brotli assets
├── env/           # Environment validation
├── nest/          # NestJS backend integration
├── security/      # Secure server headers
└── tailwind/      # Tailwind CSS integration
templates/
├── default/       # @ness/default JavaScript starter
├── typescript/    # @ness/typescript starter
├── minimal/       # @ness/minimal compact starter
├── api/           # @ness/api API-first starter
└── dashboard/     # @ness/dashboard admin starter
examples/
└── welcome/       # End-to-end framework example
docs/
├── content/       # Documentation source
├── src/           # Documentation UI and theme
└── static/        # Documentation assets
```

## Documentation and license

Documentation lives in [`docs/content`](./docs/content). Ness.js is available under the [MIT license](./LICENSE.md).
