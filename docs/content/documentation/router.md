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

The cost is one extra request: a route whose data comes from a `loader` in a `.server` module is fetched on its own rather than batched with the rest of the chain, because it now answers through a `clientLoader`. Only routes under a `loading.tsx` pay it.

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
