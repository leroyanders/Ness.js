---
sidebar_position: 5
---

# @ness/env

Validates environment variables before the application starts or builds. Validation errors contain variable names, but never print their values.

```bash
ness add env --dev
```

```js title="ness.config.mjs" showLineNumbers
import env from '@ness/env';
import { defineNessConfig } from '@ness/router';
import { ness } from '@ness/router/vite';

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
