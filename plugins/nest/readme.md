<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/nest</h1>

<p align="center">NestJS server routes for Ness.js applications</p>

NestJS 10 controllers, providers, guards, and dependency injection for Ness.js server routes.

```js
import nest from '@nessframework/nest';
import { ness } from '@nessframework/router/vite';

export default {
  plugins: [ness({ plugins: [nest()] })],
};
```

Production servers mount the compiled Nest application through `nestServer()` from `@nessframework/nest/server`.
