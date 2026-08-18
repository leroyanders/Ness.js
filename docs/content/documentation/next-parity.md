# Next.js parity APIs

Everything on this page exists so that code written for the Next.js App Router ports mechanically. Where a semantic differs, the difference is stated — nothing here pretends.

## `dynamic()`

```tsx
import { dynamic } from '@nessframework/core';

const Chart = dynamic(() => import('./chart.js'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

`React.lazy` plus Suspense, with the two conveniences worth standardizing: a declared loading state, and `ssr: false` implemented with the same two-pass hydration rule as `ClientOnly`, so the server HTML and the first client render can never disagree.

## Route metadata

A page or layout exports `metadata` or `generateMetadata`; the framework renders the tags and React hoists them into `<head>`.

```tsx
// app/routes/pricing/page.tsx
export const metadata = {
  title: 'Pricing',
  description: 'What it costs.',
  openGraph: { images: '/og/pricing.png' },
};
```

```tsx
// app/routes/blog/[slug]/page.tsx
export async function generateMetadata({ params, loaderData }) {
  return { title: loaderData.post.title };
}
```

- A layout's `title: { template: '%s | Site', default: 'Site' }` shapes every descendant page's title. Templates come from static `metadata` objects only — a template inside `generateMetadata` cannot be read without running it, and does not propagate.
- `generateMetadata` receives `{ params, loaderData }`. In RSC mode it runs on the server; in classic mode it also runs on client navigations, so derive from `loaderData` rather than reaching into a database.
- The element components (`Title`, `Meta`, `Canonical`, …) still work; the export is for code that arrives already written this way.

## File metadata

Files next to a page declare its icons and social images:

```text
app/routes/blog/[slug]/
├── page.tsx
├── icon.png              → <link rel="icon">, served as a hashed asset
├── apple-icon.png        → <link rel="apple-touch-icon">
├── opengraph-image.png   → <meta property="og:image">
└── opengraph-image.tsx   → an image route at /blog/:slug/opengraph-image
```

A dynamic `opengraph-image.tsx` default-exports a function receiving `{ params }` and returning a `Response` — usually an `ImageResponse` from `@nessframework/core/og`. `twitter-image.*` works identically.

## `global-error.tsx`

`app/routes/global-error.tsx` wraps the entire route tree and catches whatever no segment boundary caught. It receives Next's `{ error, reset }` contract. Unlike Next's, it renders inside `root.tsx` rather than replacing it: the document shell is your own file here and stays up; what this replaces is everything inside it.

## Parallel routes

```text
app/routes/dashboard/
├── layout.tsx        // receives {children, analytics, team}
├── page.tsx
├── @analytics/
│   ├── page.tsx
│   ├── loading.tsx   // this slot's own Suspense fallback
│   └── error.tsx     // this slot's own error boundary
└── @team/
    └── default.tsx   // renders when the slot has no page
```

Each `@slot` becomes a prop on the layout. A slot failing or suspending never takes its siblings down. Two honest differences from Next: slots render their own `page.tsx` (nested sub-routes inside a slot are not matched by URL), and slot pages do not run route loaders — in RSC mode they are server components and fetch their own data; in classic mode keep them presentational.

## Intercepting routes

```text
app/routes/feed/
├── page.tsx
└── (..)photo/[id]/page.tsx   // intercepts /photo/:id when navigating from /feed
```

`(.)` intercepts a sibling, each `(..)` climbs one segment, `(...)` starts at the root. On a client-side navigation from inside the interceptor's scope, the URL changes but the router does not commit: the interceptor renders in an overlay above the still-mounted screen. Back closes it; a hard load of the same URL renders the real route. `closeInterceptedRoute()` from `@nessframework/core` closes it programmatically (a modal's ✕ button).

Interceptor pages render client-side — keep them presentational, or fetch with `apiFetch`.

## `after()` and `waitUntil()`

```ts
import { after, waitUntil } from '@nessframework/core/server';

export async function action({ request }) {
  const result = await save(request);
  after(() => analytics.track('saved'));   // runs once the response is sent
  return result;
}
```

`after()` callbacks run when the response body finishes streaming — the visitor never waits on them. On Workers and Lambda the platform's own `waitUntil` keeps the runtime alive for them.

## `connection()`, `noStore()`, taint

```ts
import { connection, noStore, taintObjectReference } from '@nessframework/core/server';
```

- `noStore()` (also exported as `unstable_noStore`) marks the response per-request: the page cache neither stores it nor serves a stored copy, and fetches made under it default to `no-store`.
- `await connection()` is the same statement in the spelling Next code arrives with.
- `taintObjectReference(message, object)` / `taintUniqueValue(message, lifetime, value)` mark data that must never reach the client. Loader and action results are scanned before serialization (classic mode) and the request fails with your message instead of leaking. An application that never taints pays nothing.

## `fetch()` caching and `cache()`

Server-side `fetch` is memoized per request — a layout and a page requesting the same URL cost one network call — and opts into the shared data cache with the `next` extension:

```ts
const posts = await fetch('https://api.example.com/posts', {
  next: { revalidate: 60, tags: ['posts'] },
});
```

The data cache is the same Ness cache `cached()` uses: same adapters (memory, filesystem, SQLite, Redis), same `revalidateTag()` / `revalidatePath()`. React's `cache()` is re-exported from `@nessframework/core` for per-render memoization of anything that is not a fetch.

## Segment config

```ts
export const revalidate = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'edge';            // recorded for deployment adapters
export const maxDuration = 30;            // request fails with 504 past this
export const dynamicParams = false;       // un-prerendered params answer 404
export const fetchCache = 'default-no-store';
export const preferredRegion = 'fra1';    // recorded for deployment adapters
export const experimental_ppr = true;     // also spelled `ppr`
```

Read statically off the source, like `revalidate` always was. `maxDuration` and `dynamicParams` are enforced by the production server; `runtime`, `preferredRegion` and `maxDuration` also flow into the Vercel output (`.vc-config.json` gets the longest duration and the union of regions, since the output ships one function).

## Partial prerendering (experimental)

`@nessframework/server/ppr` provides the primitive on React's own `prerender`/`resume` pair:

```ts
import { partialResponse } from '@nessframework/server/ppr';

export async function loader({ request }) {
  return partialResponse(<Page />, { key: new URL(request.url).pathname });
}
```

The static shell — everything above your `<Suspense>` boundaries — is rendered once and cached (tagged `pages`, invalidated like any page); the holes render fresh per request and stream in behind it. The shell is truly static: dynamic reads belong below a boundary, guarded by `await connection()`. This is a primitive to call where you want it, not a default pipeline — the standard request path still hands rendering to React Router.

## `basePath` and `assetPrefix`

```js
// ness.config.mjs
export default defineNessConfig({
  router: {
    basePath: '/docs',
    assetPrefix: 'https://cdn.example.com',
  },
});
```

`basePath` serves the whole application under a prefix: routing (React Router's `basename`), links, built assets, the image endpoint and the production server's static mounts all move together. `assetPrefix` points built assets at a CDN; it applies to production builds only, and routing keeps following `basePath`.

## Custom image loader

```tsx
import { setImageLoader } from '@nessframework/core';

// once, in root.tsx
setImageLoader(({ src, width, quality }) =>
  `https://res.cloudinary.com/demo/image/fetch/w_${width},q_${quality ?? 75}/${src}`);
```

Every `<Image>` builds its `src` and `srcSet` through the loader instead of the built-in `/_ness/image` optimizer. A per-component `loader` prop overrides it. With a CDN loader the optimizer never runs, which is also how images work on runtimes without sharp.

## Multi-zones

```js
// ness.config.mjs — the composing application
export default defineNessConfig({
  server: {
    zones: [
      { basePath: '/blog', destination: 'https://blog-app.internal' },
      { basePath: '/docs', destination: 'https://docs-app.internal' },
    ],
  },
});
```

Everything under a zone's `basePath` is proxied to the deployment that owns it — the visitor sees one domain, each zone ships on its own. Give each zone app the matching `basePath` (and an `assetPrefix` if assets share a CDN) so its links and assets resolve under the composed domain. A `rewrites` entry whose destination is another origin proxies the same way.
