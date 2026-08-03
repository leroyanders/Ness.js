---
sidebar_position: 4
---

# @ness/security

Adds secure defaults to the Vite development and preview servers: clickjacking protection, MIME sniffing protection, opener isolation, a restrictive permissions policy, and a safe referrer policy.

```bash
ness add security --dev
```

```js title="ness.config.mjs" showLineNumbers
import { defineNessConfig } from '@ness/router';
import { ness } from '@ness/router/vite';
import security from '@ness/security';

export default defineNessConfig({
  vite: {
    plugins: [
      ness({
        plugins: [security({ contentSecurityPolicy: "default-src 'self'" })],
      }),
    ],
  },
});
```

Set production response headers in the `server` section of `ness.config.mjs`; this plugin protects Vite development and preview traffic.
