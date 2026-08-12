<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/core</h1>

<p align="center">The framework core: Vite integration, configuration, and the server runtime for Ness.js.</p>

The Ness.js v7 client runtime and umbrella package. Framework subsystems are published as focused `@nessframework/*` packages and re-exported here for convenience.

## Public modules

| Import                           | Purpose                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `@nessframework/core`            | Link, Form, Image, Script, navigation hooks, and compatibility exports             |
| `@nessframework/router`          | unified configuration and Next-style file route discovery                          |
| `@nessframework/router/vite`     | Ness and React Router Vite plugins                                                 |
| `@nessframework/cache`           | profiles, deduplication, SWR, tags, and path revalidation                          |
| `@nessframework/server`          | request handler, middleware, routing rules, cookies, redirects, and status helpers |
| `@nessframework/assets`          | Image, Script, local fonts, metadata, and optimized image handling                 |
| `@nessframework/deployment`      | Node, Express, serverless, and Edge adapters                                       |
| `@nessframework/instrumentation` | request/error hooks and Core Web Vitals                                            |
| `@nessframework/testing`         | route stubs, Web requests, cache, and response assertions                          |
| `@nessframework/core/rsc`        | RSC helpers (`rscConfig`, `rscSupport`, `serverOnly`, `assertSerializable`)        |

## Minimal configuration

```js
// ness.config.mjs
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';

export default defineNessConfig({
  vite: { plugins: [ness()] },
  router: { prerender: ['/'] },
});
```

```ts
// app/routes.ts
import { nessRoutes } from '@nessframework/router';
export default nessRoutes();
```

Node.js 20.19+, React 19.2.7+, and React DOM 19.2.7+ are required.
