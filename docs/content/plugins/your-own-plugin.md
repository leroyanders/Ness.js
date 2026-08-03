# Create a plugin

Ness 6 plugins use the standard Vite plugin contract. Public official plugins use the `@ness/*` scope; community plugins can use any npm package name.

## Vite plugin

```js title="ness-example/index.js" showLineNumbers
export default function example(options = {}) {
  return {
    name: 'ness:example',
    config() {
      return {
        resolve: {
          alias: { '@example': options.directory || '/src/example' },
        },
      };
    },
  };
}
```

Enable it inside the Ness Vite integration:

```js title="ness.config.mjs" showLineNumbers
import { defineNessConfig } from '@ness/router';
import { ness } from '@ness/router/vite';
import example from 'ness-example';

export default defineNessConfig({
  vite: { plugins: [ness({ plugins: [example()] })] },
});
```

Plugins can use any Vite hook, including `config`, `transform`, `generateBundle`, `configureServer`, and `handleHotUpdate`.

## Package exports

```json title="ness-example/package.json"
{
  "name": "ness-example",
  "type": "module",
  "exports": {
    ".": "./src/index.js"
  }
}
```

## Legacy Webpack support

Plugins that also support the Ness 5 compatibility runtime may export an asynchronous `install(config, options)` function:

```js
export function install(config, options) {
  if (options.target !== 'web') return config;
  config.resolve.alias = {
    ...config.resolve.alias,
    '@example': options.directory,
  };
  return config;
}
```

Legacy plugins are enabled from `ness.config.js`. Options include `target`, `env`, and `dev`.
