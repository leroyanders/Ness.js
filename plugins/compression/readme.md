# @nessframework/compression

Emits precompressed `.gz` and `.br` files for production assets.

```bash
npm install --save-dev @nessframework/compression
```

```js
import compression from '@nessframework/compression';
import { ness } from '@nessframework/router/vite';

export default {
  plugins: [ness({ plugins: [compression({ threshold: 1_024 })] })],
};
```
