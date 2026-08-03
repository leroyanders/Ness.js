# File UI routes

Routes live under `app/routes`. Ness generates the React Router route config and keeps generated wrappers in `app/.ness`; do not edit that directory.

```text
app/routes/
├── page.tsx                    # /
├── layout.tsx                  # shared layout
├── loading.tsx                 # hydration/pending fallback
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
