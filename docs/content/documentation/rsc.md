# React Server Components

RSC is the default rendering mode — `ness new my-app` already gets it, built on React Router's `unstable_reactRouterRSC` and `@vitejs/plugin-rsc`. Pass `--no-rsc` to scaffold classic SSR mode instead. See [Configuration](./config.md#router) for the `rsc` option and [`ness new`](../getting-started/commands/new.md) for the flag.

Everything below is backed by a real build and a real browser, including the one caveat — see `@nessframework/core/rsc`'s `rscSupport()` (also surfaced by [`ness doctor`](../getting-started/commands/doctor.md)) for the exact, current list.

## Server Components

A route's `page`/`layout` can be an `async` function component that fetches its own data — no `page.server.ts` loader needed:

```tsx
// app/routes/products/page.tsx
export default async function Products() {
  const products = await db.product.findMany();
  return products.map(product => (
    <article key={product.id}>{product.name}</article>
  ));
}
```

This renders correct, fully-formed HTML on the initial response. **It is not yet safe to use for a route that also needs to stay interactive after that first paint**: client-side hydration of a route whose page component is `async` currently fails with a React error ("Only Server Components can be async at the moment"), coming from React Router's RSC client entry rather than anything Ness generates. This reproduces even with zero `'use client'` children, so it isn't about client/server composition — it's specifically about hydrating an async component. Until that matures upstream, keep data fetching in a `page.server.ts` loader (see [Data loading and actions](./data-fetching.md)) for any route that needs to remain interactive — the pattern every official template already uses.

## `'use client'`

A component marked `'use client'` is a normal, synchronous component that hydrates and runs in the browser, composed inside a Server Component:

```tsx
// app/routes/products/filters.tsx
'use client';

import { useState } from 'react';

export default function Filters() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

## `'use server'`

A module marked `'use server'` exports functions callable directly from a `'use client'` component — no `<Form>`, no API route:

```ts
// app/routes/products/actions.ts
'use server';

export async function addToCart(productId: string) {
  return db.cart.add(productId);
}
```

```tsx
// app/routes/products/add-button.tsx
'use client';

import { useTransition } from 'react';
import { addToCart } from './actions.js';

export default function AddButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => addToCart(productId))}
    >
      Add to cart
    </button>
  );
}
```

This works cleanly as long as the calling component's route has no `async` page/layout ancestor — the same hydration limitation above applies to the automatic re-render a server action triggers, not just to navigation.

## Request memoization

`@nessframework/core/rsc` re-exports React 19's `cache()` as `requestCache` — per-render deduplication, not persistence:

```ts
import { requestCache } from '@nessframework/core/rsc';

const getUser = requestCache(async (id: string) => db.user.find(id));
```

Call `getUser` from more than one Server Component in the same tree and it fetches once per render. This is a different tool from [`cached()`](./caching.md) in `@nessframework/cache`, which is cross-request, TTL/tag-based caching (Ness's equivalent of Next's Data Cache / ISR) — use `requestCache` for same-render dedup, `cached()` for caching across requests.
