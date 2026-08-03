# Metadata and optimized assets

## Metadata

```tsx
import { defineMetadata } from '@ness/assets/metadata';

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
import { Image } from '@ness/assets/image';

<Image
  src="/hero.jpg"
  alt="Product collection"
  width={1200}
  height={630}
  priority
/>;
```

Ness emits responsive `srcset` values and the production runtime negotiates AVIF/WebP, validates local paths and remote allowlists, and caches immutable variants. `fill`, blur placeholders, static image objects, custom quality, and unoptimized/external loaders are supported.

## Fonts and scripts

`localFont` creates self-hosted `@font-face` rules, preload links, stable class names, fallbacks, and CSS variables. `<Script>` supports `beforeInteractive`, `afterInteractive`, and `lazyOnload` strategies.
