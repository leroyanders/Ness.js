<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/env</h1>

<p align="center">Environment variable validation for Ness.js applications.</p>

Fails development or production builds when required environment variables are missing or invalid.

```bash
npm install --save-dev @nessframework/env
```

```js
import env from '@nessframework/env';
import { ness } from '@nessframework/router/vite';

export default {
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
};
```
