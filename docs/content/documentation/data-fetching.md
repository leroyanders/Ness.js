# Data loading and actions

Use loaders for page reads, actions for progressively enhanced UI mutations, and NestJS controllers for public APIs and webhooks.

## Loader

```ts
// app/routes/products/page.server.ts
export async function loader({ request }: { request: Request }) {
  const query = new URL(request.url).searchParams.get('q');
  return { products: await db.product.search(query) };
}
```

```tsx
// app/routes/products/page.tsx
import { useLoaderData } from 'react-router';

export default function Products() {
  const data = useLoaderData<typeof import('./page.server').loader>();
  return data.products.map(product => (
    <article key={product.id}>{product.name}</article>
  ));
}
```

## Action

```ts
export async function action({ request }: { request: Request }) {
  const form = await request.formData();
  await db.product.create({ name: String(form.get('name')) });
  return { ok: true };
}
```

```tsx
import { Form } from '@nessframework/core';

export default function NewProduct() {
  return (
    <Form method="post">
      <input name="name" />
      <button>Create</button>
    </Form>
  );
}
```

Ness/React Router cancels superseded requests, prevents stale navigation commits, revalidates loaders after actions, and works without client JavaScript through progressive enhancement.

## Public API data

Public JSON APIs use Nest controllers and injectable services:

```ts
import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll() {
    return this.products.findAll();
  }
}
```

This route is available at `/api/products`. See [NestJS backend](./nest.md).

## Avoid waterfalls

Start independent work together with `Promise.all`, or return a promise from the loader without awaiting it and render it inside a `<Suspense>`/`<Await>` boundary for progressive streaming.

```ts
// app/routes/products/[id]/page.server.ts
export async function loader({ params }: { params: { id: string } }) {
  return {
    product: await getProduct(params.id), // blocks the shell
    reviews: getReviews(params.id), // streams in later
  };
}
```

`<Streamed>` from `@nessframework/components` wires the `<Suspense>`, the `<Await>`, and the error element together:

```tsx
import { Streamed } from '@nessframework/components';

<Streamed
  value={reviews}
  fallback={<ReviewsSkeleton />}
  error={() => <p>Reviews are unavailable.</p>}
>
  {list => <Reviews items={list} />}
</Streamed>;
```

Passing `error` keeps a rejection local: the slow panel renders its own error instead of replacing the page through the route boundary. See [Components](./components.md).
