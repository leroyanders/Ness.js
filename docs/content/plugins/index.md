---
slug: /plugins
---

# Plugin ecosystem

Ness 6 plugins use Vite hooks and are composed through `ness({ plugins })`. Official integrations are ESM-only, typed, tested on Node 16+, and include legacy Webpack hooks where applicable.

| Package             | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `@ness/nest`        | NestJS controllers, DI, guards, and server modules    |
| `@ness/tailwind`    | Tailwind CSS 4 and production CSS optimization        |
| `@ness/security`    | Secure headers for Vite development and preview       |
| `@ness/env`         | Required variables, formats, choices, and validators  |
| `@ness/compression` | Precompressed Gzip and Brotli production assets       |
| `@ness/analyzer`    | JSON/HTML bundle reports and enforceable size budgets |

Install an official plugin by its short name:

```bash
ness add tailwind --dev
ness add security --dev
ness add nest
```

The CLI expands these aliases to packages such as `@ness/tailwind`, `@ness/security`, and `@ness/nest`.

## Compose plugins

```js title="ness.config.mjs" showLineNumbers
import analyzer from '@ness/analyzer';
import compression from '@ness/compression';
import { defineNessConfig } from '@ness/router';
import env from '@ness/env';
import nest from '@ness/nest';
import { ness } from '@ness/router/vite';
import security from '@ness/security';

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
