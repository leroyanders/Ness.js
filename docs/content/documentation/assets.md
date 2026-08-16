# Metadata and optimized assets

## Metadata

A page declares its metadata in its own markup, with the components from `@nessframework/components`. React hoists `<title>`, `<meta>` and `<link>` into `<head>` from anywhere in the tree, so there is no `meta` route export and nothing for a parent to render on the page's behalf.

```tsx title="app/routes/products/page.tsx"
import {
  Canonical,
  Description,
  Meta,
  SocialImage,
  Title,
} from '@nessframework/components';

export default function Products() {
  return (
    <main>
      <Meta>
        <Title>Products</Title>
        <Description>Product catalog</Description>
        <Canonical href="https://example.com/products" />
        <SocialImage src="https://example.com/og/products.png" />
      </Meta>
      <h1>Products</h1>
    </main>
  );
}
```

`<Title>` and `<Description>` emit their Open Graph equivalents too, and `<SocialImage>` carries the large-image card type with it. See [Components](./components.md).

`createManifest`, `createRobots`, and `createSitemap` from `@nessframework/assets/metadata` return Web `Response` objects for low-level React Router resource modules. Public JSON APIs belong in NestJS controllers.

## Images

```tsx
import { Image } from '@nessframework/assets/image';

<Image
  src="/hero.jpg"
  alt="Product collection"
  width={1200}
  height={630}
  priority
/>;
```

Ness emits responsive `srcset` values and the production runtime negotiates AVIF/WebP, validates local paths and remote allowlists, and caches encoded variants. `fill`, blur placeholders, static image objects, custom quality, and unoptimized/external loaders are supported.

### The variant cache

An encoded variant is stored through the application's configured cache, so a second instance reuses the work rather than repeating it. A repeat request costs about 0.1 ms against 25 ms to re-encode — the resize and encode dominate everything else the request does.

The key is the source, the width bucket, the quality, the negotiated format, and a fingerprint of the source file. Replacing the file changes its size or mtime, which changes the key, so the new image is served rather than the old encoding under the same URL. Remote sources have no cheap fingerprint — fetching one to hash it is the work we are trying to avoid — so they are keyed by URL and age out with `life`.

Each response carries an `ETag`. A matching `If-None-Match` is answered `304` before the cache is read at all.

A burst of requests for one missing variant produces a single encode rather than one per request, and concurrent encodes are capped so a miss storm cannot start a sharp pipeline per connection.

```js title="ness.config.mjs"
export default defineNessConfig({
  server: {
    images: {
      cache: { life: 'days', tags: ['images'] },
      concurrency: 4,
    },
  },
});
```

`cache: false` re-encodes on every request. `revalidateTag('images')` clears every stored variant.

## Share cards

```tsx title="app/routes/og/route.tsx"
import { ImageResponse } from '@nessframework/core/og';

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#faf6ef',
      }}
    >
      <h1 style={{ margin: 'auto', fontSize: 64 }}>Ness.js</h1>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Inter', data: await inter() }],
    },
  );
}
```

Rendered with [satori](https://github.com/vercel/satori), an optional peer — install it in the projects that want cards, and nothing else pays for it. Rasterization goes through the same `sharp` the image pipeline already uses; `format: 'svg'` skips it. There is no default font: satori cannot lay out text without one, and shipping a face inside the framework would be choosing a typeface, and a licence, for every application.

## Fonts and scripts

`localFont` creates self-hosted `@font-face` rules, preload links, stable class names, fallbacks, and CSS variables. `<Script>` supports `beforeInteractive`, `afterInteractive`, and `lazyOnload` strategies.
