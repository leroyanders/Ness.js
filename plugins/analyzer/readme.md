# @nessframework/analyzer

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
