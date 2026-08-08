---
sidebar_position: 4
---

# @nessframework/security

Adds secure defaults to the Vite development and preview servers: clickjacking protection, MIME sniffing protection, opener isolation, a restrictive permissions policy, and a safe referrer policy.

```bash
ness add security --dev
```

```js title="ness.config.mjs" showLineNumbers
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import security from '@nessframework/security';

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

`headers` adds or overrides individual headers, and a header set to `false` there drops one of the defaults. `defaults: false` starts from nothing at all.

Set production response headers in the `server` section of `ness.config.mjs`; this plugin protects Vite development and preview traffic.
