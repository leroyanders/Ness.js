# File UI routes

Routes live under `app/routes`. Ness generates the React Router route config and keeps generated wrappers in `app/.ness`; do not edit that directory.

```text
app/routes/
├── page.tsx                    # /
├── layout.tsx                  # shared layout
├── loading.tsx                 # pending boundary for the segment
├── error.tsx                   # error boundary
├── not-found.tsx               # thrown and unmatched 404
├── forbidden.tsx               # thrown 403
├── unauthorized.tsx            # thrown 401
├── middleware.ts               # route middleware
├── blog/[slug]/page.tsx        # /blog/:slug
```

## Segments

- `[slug]` is dynamic.
- `[...parts]` and `[[...parts]]` are catch-all segments.
- `(marketing)` groups files without adding a URL segment.
- `_components` is private and does not add a URL segment.

## Segment configuration

A page states its own caching rules, and the production server reads them from the build manifest before it renders anything:

```ts title="app/routes/blog/[slug]/page.server.ts"
export const revalidate = 60; // seconds; `false` never expires, `0` is per-request
export const dynamic = 'force-dynamic'; // or 'force-static'
```

`force-dynamic` (and `revalidate = 0`) takes the URL out of the shared page cache entirely — it is neither answered from it nor stored in it. A page that says nothing follows the application-wide policy, as before. The values are read statically, so they must be literals.

Prerendering a dynamic route's paths still happens in `ness.config.mjs` — `router.prerender` accepts a function — rather than as a per-route export.

## Metadata files

```text
app/routes/
├── sitemap.ts     # /sitemap.xml
├── robots.ts      # /robots.txt
└── manifest.ts    # /manifest.webmanifest
```

Each exports a default function returning ordinary data; the framework serializes it and sets the content type. They can live in any segment, published under that segment's path.

## Templates

A `template.tsx` wraps the segment's children like a layout, except it is rebuilt on every navigation instead of persisting — for an entry animation, or an effect that must run per visit. One instance sits in the tree, keyed by the history entry.

## Loading and navigation

A `loading.tsx` is the segment's pending boundary. It covers what the segment renders _inside_ its own layout — its page and everything nested below it — and not the layout itself, which belongs to the segment above.

```text
app/routes/
├── loading.tsx                 # covers /, /dashboard's layout, /login …
└── dashboard/
    ├── layout.tsx              # stays on screen
    ├── loading.tsx             # covers /dashboard and everything under it
    └── chat/page.tsx
```

A route covered by one navigates differently: the address changes immediately, the layouts above it stay exactly as they are, and the segment renders its `loading.tsx` while the data loads. Moving between two pages under the same layout therefore replaces the page area and nothing else, and a navigation that also reloads the layout falls back one level up instead — each route answers only for itself, so the nesting needs no configuration.

A route with no `loading.tsx` above it navigates as it always has: the previous page stays on screen until the data arrives. So does a route with no loader — there is nothing to wait for.

Three things are deliberately not streamed:

- **A revalidation of the page on screen** — after a `<Form>`, after `revalidate()`. The reader is looking at real content, and replacing it with a skeleton is a step backwards.
- **A load that finishes within a few milliseconds** — from `cachedClientLoader`, from a prefetch, from Back. Those navigate in a single frame with no fallback at all.
- **Back and Forward**, which render from the client cache when it holds the page.

The cost is one extra request: a route whose data comes from a `loader` in a `.server` module is fetched on its own rather than batched with the rest of the chain, because it now answers through a `clientLoader`. Only routes under a `loading.tsx` — or inside the client cache below — pay it.

## Client cache

After the first document load, navigation is client-side: a `<Link>` click is a `pushState`, and the only thing that still reaches the server is the data request for the destination's loaders. `clientCache` removes that round trip too:

```tsx title="app/routes/dashboard/page.tsx"
export const clientCache = 60;
```

Within the window, a client-side navigation back to the page is answered from memory — no fetch, no skeleton, one frame. Past it, the next navigation loads normally and re-arms the window. A `loading.tsx` is not required; a page that streams and a page that blocks cache the same way.

To state it once for the whole application:

```ts title="ness.config.ts"
export default defineNessConfig({
  router: { clientCache: 60 },
});
```

A page's own export overrides the default, and `export const clientCache = 0` opts a page back out entirely.

Three guarantees hold either way:

- **Any mutation clears the whole cache** — a `<Form>` submission or a `useFetcher()` finishing empties it, so an edit never renders stale.
- **A revalidation of the page on screen always reaches the network** — `revalidate()` refreshes for real.
- **Back and Forward render from memory whenever they can**, window or no window, and refresh behind the reader afterwards.

The cache is per-tab memory: a document request never sees it, and a reload starts it empty. Pair it with a server-side `revalidate` on the page (see [Caching](./caching.md)) and the navigations that do miss it stop running loaders as well.

`<Link prefetch>` warms the same machinery ahead of the click: the target's module chunk and its loader data (`.data`/`.rsc`) are requested while the link is hovered or scrolled into view, so the navigation that follows finds both already local.

## Server data

A page may keep client-safe exports in `page.tsx` and server-only work in `page.server.ts`:

```tsx
// app/routes/blog/[slug]/page.server.ts
export async function loader({ params }: { params: { slug: string } }) {
  return db.post.findUniqueOrThrow({ where: { slug: params.slug } });
}

export async function action({ request }: { request: Request }) {
  const form = await request.formData();
  await updatePost(form);
  return { ok: true };
}
```

Only `loader`, `action`, `headers`, and `shouldRevalidate` are picked up from the adjacent `.server` module; anything else it exports stays private to it. Importing a `.server` module from client code fails the build rather than shipping it.

Use `<Form>` and fetchers for mutations; they progressively enhance native HTML forms and automatically revalidate route data.

## NestJS server routes

```ts
// app/server/posts/posts.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('posts')
export class PostsController {
  @Get()
  findAll() {
    return db.post.findMany();
  }

  @Post()
  create(@Body() input: CreatePost) {
    return db.post.create({ data: input });
  }
}
```

Controllers are mounted below `/api` by default, so this controller handles `/api/posts`. Nest owns controllers, providers, guards, pipes, interceptors, and dependency injection; React Router continues to own pages, layouts, loaders, actions, and SSR.

Generate and register a controller with `ness g controller posts`. See [NestJS backend](./nest.md) for modules, configuration, and the production bridge.

Low-level React Router `route.ts` resource modules remain available as an escape hatch for Web-standard responses, metadata files, and runtime-specific endpoints. Application APIs should use Nest controllers.
