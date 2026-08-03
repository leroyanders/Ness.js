# @nessframework/env

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
