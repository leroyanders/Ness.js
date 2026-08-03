# @nessframework/nest

NestJS 10 controllers, providers, guards, and dependency injection for Ness.js server routes.

```js
import nest from '@nessframework/nest';
import { ness } from '@nessframework/router/vite';

export default {
  plugins: [ness({ plugins: [nest()] })],
};
```

Production servers mount the compiled Nest application through `nestServer()` from `@nessframework/nest/server`.
