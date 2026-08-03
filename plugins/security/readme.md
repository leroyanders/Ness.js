# @ness/security

Adds secure defaults to Vite development and preview servers. Production response headers remain configurable through the `server` section of `ness.config.mjs`.

```bash
npm install --save-dev @ness/security
```

```js
import { ness } from '@ness/router/vite';
import security from '@ness/security';

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
