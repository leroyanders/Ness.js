# Create a plugin

Ness 7 plugins use the standard Vite plugin contract. Public official plugins use the `@nessframework/*` scope; community plugins can use any npm package name.

## Vite plugin

```js title="ness-example/src/index.js" showLineNumbers
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
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import example from 'ness-example';

export default defineNessConfig({
  vite: { plugins: [ness({ plugins: [example()] })] },
});
```

Plugins can use any Vite hook, including `config`, `transform`, `generateBundle`, `configureServer`, and `handleHotUpdate`.

`ness()` flattens the `plugins` array and drops falsy entries, so a factory may return several Vite plugins at once and an entry can be gated with `condition && plugin()`. The entries are registered after the framework's own plugins and React Router's, and before the development error overlay.

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

## Migrating a Ness 5 plugin

Ness 5 and 6 plugins exported an `install(config, options)` function that mutated a Webpack configuration. That runtime was removed in Ness 7, and `install` is no longer called.

Rewrite the plugin as a Vite plugin. Most of the mapping is direct:

| Ness 5 (`install`)            | Vite plugin                                      |
| ----------------------------- | ------------------------------------------------ |
| `config.resolve.alias`        | return `{ resolve: { alias } }` from `config()`  |
| `config.module.rules`         | `transform(code, id)`                            |
| `config.plugins.push(...)`    | a Rollup hook such as `generateBundle`           |
| `config.devServer.headers`    | return `{ server: { headers } }` from `config()` |
| `options.dev` / `options.env` | the `environment.command` argument to `config()` |
