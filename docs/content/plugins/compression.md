---
sidebar_position: 6
---

# @nessframework/compression

Creates precompressed Gzip and Brotli copies of production assets. Compatible servers and CDNs can serve them without compressing every response at runtime.

```bash
ness add compression --dev
```

```js title="ness.config.mjs" showLineNumbers
import compression from '@nessframework/compression';
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';

export default defineNessConfig({
  vite: {
    plugins: [ness({ plugins: [compression({ threshold: 1_024 })] })],
  },
});
```

By default, both `.gz` and `.br` files are emitted for compressible assets larger than 1 KiB.

`ness start` serves them. It negotiates `Accept-Encoding`, rewrites the request to the twin, keeps the original `Content-Type`, and sets `Content-Encoding` and `Vary` — so the plugin is worth adding even without a CDN in front.

The plugin walks the output directory after the build rather than reading Vite's in-memory bundle. Vite post-processes chunks on the way to disk, so a twin built from the bundle can decode to something the server never serves; and files copied from `public/` are written to the output without ever being bundle entries, so iterating the bundle misses them.

## What it does not cover

Files written after the Vite build — the route manifest, prerendered HTML — have no twin, because the plugin has already finished by the time they land.

Prerendered pages are unaffected in practice: they are served through the request handler, which compresses them per request. The route manifest is served as a static file and ships uncompressed. Put a CDN or a reverse proxy in front if that matters for your traffic.
