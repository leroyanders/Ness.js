# @ness/analyzer

Generates JSON and HTML bundle reports and optionally enforces a total bundle-size budget.

```bash
npm install --save-dev @ness/analyzer
```

```js
import analyzer from '@ness/analyzer';
import { ness } from '@ness/router/vite';

export default {
  plugins: [ness({ plugins: [analyzer({ maxSize: 750_000 })] })],
};
```
