---
sidebar_position: 6
---

# @ness/compression

Creates precompressed Gzip and Brotli copies of production assets. Compatible servers and CDNs can serve them without compressing every response at runtime.

```bash
ness add compression --dev
```

```js title="ness.config.mjs" showLineNumbers
import compression from '@ness/compression';
import { defineNessConfig } from '@ness/router';
import { ness } from '@ness/router/vite';

export default defineNessConfig({
  vite: {
    plugins: [ness({ plugins: [compression({ threshold: 1_024 })] })],
  },
});
```

By default, both `.gz` and `.br` files are emitted for compressible assets larger than 1 KiB.
