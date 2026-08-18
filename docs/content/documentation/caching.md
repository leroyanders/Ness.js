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

Server-side `fetch()` plugs into the same cache: identical GETs inside one request share one network call, and `fetch(url, {next: {revalidate: 60, tags: ['posts']}})` stores the response through whatever adapter is configured — invalidated by the same `revalidateTag`/`revalidatePath`. `noStore()` (or `await connection()`) from `@nessframework/core/server` takes a whole response out of the page cache. See [Next.js parity](./next-parity.md#fetch-caching-and-cache).

## Adapters

`MemoryCacheAdapter` is the default and is process-local: a second instance keeps its own copy, and `revalidateTag` on one instance does not reach the others. Anything running more than one process needs a shared adapter.

Configure one in the `server` section of `ness.config.mjs`:

```js
import { defineNessConfig } from '@nessframework/router';

export default defineNessConfig({
  server: {
    cache: { adapter: 'filesystem', directory: '.ness/cache' },
  },
});
```

| Adapter      | Shared across                   | Needs                         | Use it when                                        |
| ------------ | ------------------------------- | ----------------------------- | -------------------------------------------------- |
| `memory`     | nothing                         | —                             | development, single process                        |
| `filesystem` | processes on one host, restarts | a writable directory          | one container, clustered Node, no external service |
| `sqlite`     | processes on one host, restarts | Node.js 22.5+ (`node:sqlite`) | same as above, with indexed invalidation           |
| `redis`      | every instance                  | a Redis client you supply     | more than one host or replica                      |

Redis takes the client from your config rather than bundling one, so connection, TLS, and pooling stay yours:

```js
import { createClient } from 'redis';

const client = await createClient({ url: process.env.REDIS_URL }).connect();

export default defineNessConfig({
  server: {
    cache: { adapter: 'redis', client, prefix: 'app:cache:' },
  },
});
```

### Tag and path invalidation

Adapters expose `keysByTag` and `keysByPath`, so `revalidateTag('posts')` resolves the affected keys from an index instead of reading every cached entry. An adapter of your own may omit them — the cache falls back to a scan, which stays correct but costs one read per entry.

### Local tier

A shared store turns every cache hit into a network round trip. Set `local` to keep an in-process tier in front of it:

```js
cache: { adapter: 'redis', client, local: true, bus }
```

The local tier reintroduces the problem the shared store solved: deleting an entry in Redis does not evict the copy another instance already holds in memory. Pass a `bus` so instances broadcast evictions to each other:

```js
import { createRedisInvalidationBus } from '@nessframework/cache/tiered';

const bus = createRedisInvalidationBus(client, subscriber);
```

`subscriber` must be a separate connection — Redis does not allow other commands on a subscribed one. Without a bus, `localTtl` (5 seconds by default) bounds how long an instance may trust a local copy.

## Static generation

```js
import { defineNessConfig } from '@nessframework/router';

export default defineNessConfig({
  router: { prerender: ['/', '/pricing'] },
});
```

Prerendered HTML and data are emitted into `build/client`. Other pages use SSR. The Ness production server adds CDN-compatible `s-maxage` and `stale-while-revalidate` headers and performs incremental regeneration for anonymous HTML GET requests.

A response the page cache took part in carries `x-ness-cache`: `MISS` on the render that was stored, `HIT` on a replay of a fresh entry, and `STALE` on a replay of an entry past its `stale` age — the last of which may have a background refresh running behind it. A request the cache refused carries no such header at all.

### Draft mode

```ts title="app/routes/preview/route.ts"
import { enableDraftMode, redirect } from '@nessframework/core/server';

export function GET(request: Request) {
  return redirect('/blog/hello', {
    headers: { 'set-cookie': enableDraftMode() },
  });
}
```

`draftMode(request).isEnabled` then tells a loader to fetch unpublished content. The cookie is signed with `NESS_DRAFT_SECRET` and expires on its own, so possession of the name alone proves nothing — and because it is a cookie, the page cache refuses the request from before it is read, which is exactly the behaviour a preview needs.

### What the page cache refuses

A request carrying a `cookie` or an `authorization` header bypasses the page cache entirely — it is neither answered from the cache nor stored in it. The check happens before the cache is read, not only before it is written: deciding on the way out alone would still let a credentialed request be served another visitor's rendering.

A response carrying `set-cookie` is never stored, whatever the policy says. The page cache is shared and replays stored headers verbatim, so keeping one would hand the same cookie to every subsequent visitor — an anonymous session id, a CSRF token or an experiment bucket minted on a plain `GET` is enough. The request-side check cannot catch this on its own, because the first visitor arrives without a cookie and is issued one by the render.

That second refusal is enforced around `cachePolicy` rather than inside it, so a project supplying its own policy cannot reintroduce the leak by forgetting the check.

If you replace `cachePolicy`, consider `cacheableRequest` alongside it. The first decides what is kept; the second decides whether the cache is touched at all.
