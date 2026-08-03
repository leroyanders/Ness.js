# @ness/core

The Ness.js v6 client runtime and compatibility facade. Framework subsystems are published as focused `@ness/*` packages, while the legacy `@ness/core/*` paths remain available for migration.

## Public modules

| Import                  | Purpose                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `@ness/core`            | Link, Form, Image, Script, navigation hooks, and compatibility exports             |
| `@ness/router`          | unified configuration and Next-style file route discovery                          |
| `@ness/router/vite`     | Ness and React Router Vite plugins                                                 |
| `@ness/cache`           | profiles, deduplication, SWR, tags, and path revalidation                          |
| `@ness/server`          | request handler, middleware, routing rules, cookies, redirects, and status helpers |
| `@ness/assets`          | Image, Script, local fonts, metadata, and optimized image handling                 |
| `@ness/deployment`      | Node, Express, serverless, and Edge adapters                                       |
| `@ness/instrumentation` | request/error hooks and Core Web Vitals                                            |
| `@ness/testing`         | route stubs, Web requests, cache, and response assertions                          |
| `@ness/core/rsc`        | experimental RSC helpers                                                           |

## Minimal configuration

```js
// ness.config.mjs
import { defineNessConfig } from '@ness/router';
import { ness } from '@ness/router/vite';

export default defineNessConfig({
  vite: { plugins: [ness()] },
  router: { prerender: ['/'] },
});
```

```ts
// app/routes.ts
import { nessRoutes } from '@ness/router';
export default nessRoutes();
```

Node.js 16+, React 19.2.7+, and React DOM 19.2.7+ are required.
