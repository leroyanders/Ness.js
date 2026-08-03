---
sidebar_position: 5
---

# @nessframework/env

Validates environment variables before the application starts or builds. Validation errors contain variable names, but never print their values.

```bash
ness add env --dev
```

```js title="ness.config.mjs" showLineNumbers
import env from '@nessframework/env';
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';

export default defineNessConfig({
  vite: {
    plugins: [
      ness({
        plugins: [
          env({
            schema: {
              DATABASE_URL: { required: true, pattern: /^postgres/ },
              NODE_ENV: { choices: ['development', 'test', 'production'] },
            },
          }),
        ],
      }),
    ],
  },
});
```

Rules support `required`, regular expressions, allowed choices, and custom validator functions.
