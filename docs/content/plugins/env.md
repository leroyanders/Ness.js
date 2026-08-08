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

A rule can also be written in shorthand: `true` or `'required'` for a required variable, a bare regular expression for a format, and a bare function for a validator — so `{ DATABASE_URL: true }` and `{ DATABASE_URL: { required: true } }` are the same rule. A validator returning a string uses that string as the message. Only `required` rejects a missing variable; every other rule is skipped when the variable is unset.
