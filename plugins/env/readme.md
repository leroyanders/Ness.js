# @ness/env

Fails development or production builds when required environment variables are missing or invalid.

```bash
npm install --save-dev @ness/env
```

```js
import env from '@ness/env';
import { ness } from '@ness/router/vite';

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
