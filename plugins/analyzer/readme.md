<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/analyzer</h1>

<p align="center">Bundle reports and size budgets for Ness.js applications.</p>

Generates JSON and HTML bundle reports and optionally enforces a total bundle-size budget.

```bash
npm install --save-dev @nessframework/analyzer
```

```js
import analyzer from '@nessframework/analyzer';
import { ness } from '@nessframework/router/vite';

export default {
  plugins: [ness({ plugins: [analyzer({ maxSize: 750_000 })] })],
};
```
