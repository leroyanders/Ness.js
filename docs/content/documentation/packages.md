# Framework packages

Ness is split into focused ESM packages. Applications install only the public modules they import, while `@nessframework/core` remains the client runtime and a compatibility facade for older `@nessframework/core/*` imports.

| Package                          | Responsibility                                                        |
| -------------------------------- | --------------------------------------------------------------------- |
| `@nessframework/core`            | React components, navigation hooks, RSC compatibility, legacy exports |
| `@nessframework/router`          | `ness.config.mjs`, file-system routes, React Router, Vite plugins     |
| `@nessframework/server`          | Web request handling, middleware, routing rules, response helpers     |
| `@nessframework/cache`           | cache profiles, SWR, deduplication, tag and path invalidation         |
| `@nessframework/assets`          | optimized images, local fonts, scripts, metadata and SEO responses    |
| `@nessframework/instrumentation` | server lifecycle hooks, error hooks, and Core Web Vitals              |
| `@nessframework/deployment`      | Node, Express, serverless, Edge, health, and shutdown adapters        |
| `@nessframework/testing`         | route stubs, requests, isolated caches, and response assertions       |

## Imports

```js
import { defineNessConfig, nessRoutes } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import { createNessRequestHandler } from '@nessframework/server';
import { cached, revalidateTag } from '@nessframework/cache';
import { Image } from '@nessframework/assets/image';
import { defineMetadata } from '@nessframework/assets/metadata';
```

The more specific asset entry points keep server-only dependencies out of browser bundles:

```js
import { Image } from '@nessframework/assets/image';
import { createImageHandler } from '@nessframework/assets/image/server';
import { localFont } from '@nessframework/assets/font';
import { Script } from '@nessframework/assets/script';
```

## Migration from `@nessframework/core/*`

The old entry points continue to re-export the new packages, so the migration can be incremental. Prefer the direct form in new code:

```diff
- import { cached } from '@nessframework/core/cache';
+ import { cached } from '@nessframework/cache';

- import { defineNessConfig } from '@nessframework/core/config';
+ import { defineNessConfig } from '@nessframework/router';

- import { Image } from '@nessframework/core/image';
+ import { Image } from '@nessframework/assets/image';
```
