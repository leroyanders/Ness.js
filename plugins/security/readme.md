<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/security</h1>

<p align="center">Secure development and preview headers for Ness.js applications.</p>

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
