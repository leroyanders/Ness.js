# Metadata and optimized assets

## Metadata

```tsx
import { defineMetadata } from '@nessframework/assets/metadata';

export const meta = () =>
  defineMetadata({
    title: 'Products',
    description: 'Product catalog',
    alternates: { canonical: 'https://example.com/products' },
    openGraph: { images: ['/og/products.png'] },
    twitter: { card: 'summary_large_image' },
  });
```

`createManifest`, `createRobots`, and `createSitemap` return Web `Response` objects for low-level React Router resource modules. Public JSON APIs belong in NestJS controllers.

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

## Fonts and scripts

`localFont` creates self-hosted `@font-face` rules, preload links, stable class names, fallbacks, and CSS variables. `<Script>` supports `beforeInteractive`, `afterInteractive`, and `lazyOnload` strategies.
