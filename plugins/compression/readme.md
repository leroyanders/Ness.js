# @ness/compression

Emits precompressed `.gz` and `.br` files for production assets.

```bash
npm install --save-dev @ness/compression
```

```js
import compression from '@ness/compression';
import { ness } from '@ness/router/vite';

export default {
  plugins: [ness({ plugins: [compression({ threshold: 1_024 })] })],
};
```
