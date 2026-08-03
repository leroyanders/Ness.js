# @ness/nest

NestJS 10 controllers, providers, guards, and dependency injection for Ness.js server routes.

```js
import nest from '@ness/nest';
import { ness } from '@ness/router/vite';

export default {
  plugins: [ness({ plugins: [nest()] })],
};
```

Production servers mount the compiled Nest application through `nestServer()` from `@ness/nest/server`.
