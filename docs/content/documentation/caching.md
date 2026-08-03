# Caching, SSG, and ISR

## Function cache

```ts
import { cached, revalidatePath, revalidateTag } from '@nessframework/cache';

export const getPosts = cached(() => db.post.findMany(), {
  key: 'posts',
  life: 'minutes',
  tags: ['posts'],
  path: '/posts',
});

await revalidateTag('posts');
await revalidatePath('/posts');
```

Profiles include `seconds`, `minutes`, `hours`, `days`, `max`, and `default`. Concurrent calls are deduplicated. Expired values are regenerated; stale values are served while one background refresh runs.

`MemoryCacheAdapter` is the default. Supply a shared adapter through `setCache` or the `server` section of `ness.config.mjs` for multi-instance deployments.

## Static generation

```js
import { defineNessConfig } from '@nessframework/router';

export default defineNessConfig({
  router: { prerender: ['/', '/pricing'] },
});
```

Prerendered HTML and data are emitted into `build/client`. Other pages use SSR. The Ness production server adds CDN-compatible `s-maxage` and `stale-while-revalidate` headers and performs incremental regeneration for anonymous HTML GET requests.

Requests with cookies or authorization headers bypass the default page cache.
