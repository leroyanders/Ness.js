<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/compression</h1>

<p align="center">Gzip and Brotli build assets for Ness.js applications.</p>

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
