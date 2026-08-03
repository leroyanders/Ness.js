# @nessframework/security

Adds secure defaults to Vite development and preview servers. Production response headers remain configurable through the `server` section of `ness.config.mjs`.

```bash
npm install --save-dev @nessframework/security
```

```js
import { ness } from '@nessframework/router/vite';
import security from '@nessframework/security';

export default {
  plugins: [
    ness({
      plugins: [
        security({
          contentSecurityPolicy: "default-src 'self'",
        }),
      ],
    }),
  ],
};
```
