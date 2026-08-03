---
slug: /plugins
---

# Plugin ecosystem

Ness 6 plugins use Vite hooks and are composed through `ness({ plugins })`. Official integrations are ESM-only, typed, tested on Node 16+, and include legacy Webpack hooks where applicable.

| Package                      | Purpose                                               |
| ---------------------------- | ----------------------------------------------------- |
| `@nessframework/nest`        | NestJS controllers, DI, guards, and server modules    |
| `@nessframework/tailwind`    | Tailwind CSS 4 and production CSS optimization        |
| `@nessframework/security`    | Secure headers for Vite development and preview       |
| `@nessframework/env`         | Required variables, formats, choices, and validators  |
| `@nessframework/compression` | Precompressed Gzip and Brotli production assets       |
| `@nessframework/analyzer`    | JSON/HTML bundle reports and enforceable size budgets |

Install an official plugin by its short name:

```bash
ness add tailwind --dev
ness add security --dev
ness add nest
```

The CLI expands these aliases to packages such as `@nessframework/tailwind`, `@nessframework/security`, and `@nessframework/nest`.

## Compose plugins

```js title="ness.config.mjs" showLineNumbers
import analyzer from '@nessframework/analyzer';
import compression from '@nessframework/compression';
import { defineNessConfig } from '@nessframework/router';
import env from '@nessframework/env';
import nest from '@nessframework/nest';
import { ness } from '@nessframework/router/vite';
import security from '@nessframework/security';

export default defineNessConfig({
  vite: {
    plugins: [
      ness({
        plugins: [
          nest(),
          env({ schema: { DATABASE_URL: true } }),
          security(),
          compression(),
          analyzer({ maxSize: 750_000 }),
        ],
      }),
    ],
  },
});
```

Open an individual plugin page for installation, options, and output details. To create a reusable integration, see [Create a plugin](./your-own-plugin.md).
