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

By default, both `.gz` and `.br` files are emitted for `.css`, `.html`, `.js`, `.json`, `.svg`, `.txt` and `.xml` files larger than 1 KiB. A twin is only kept when it is smaller than the file it came from, so an already-dense asset is left alone.

`algorithms` narrows the set to `['gzip']` or `['brotli']`, `gzipLevel` and `brotliQuality` trade build time against size, and `test` — a regular expression or a predicate over the filename — replaces the default extension list.

`ness start` serves them. It negotiates `Accept-Encoding`, rewrites the request to the twin, keeps the original `Content-Type`, and sets `Content-Encoding` and `Vary` — so the plugin is worth adding even without a CDN in front.

The plugin walks the output directory after the build rather than reading Vite's in-memory bundle. Vite post-processes chunks on the way to disk, so a twin built from the bundle can decode to something the server never serves; and files copied from `public/` are written to the output without ever being bundle entries, so iterating the bundle misses them.

## What it does not cover

Anything written after the client build has no twin, because the plugin has already walked the output by the time it lands.

The one that reaches a visitor is React Router's client route manifest, `build/client/assets/manifest-<hash>.js`. It is emitted during the server build, after the client build's pass has finished, so it is served uncompressed. Put a CDN or a reverse proxy in front if that matters for your traffic.

Prerendered HTML is unaffected: it is served through the request handler, which compresses per request.
