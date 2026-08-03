# Framework packages

Ness is split into focused ESM packages. Applications install only the public modules they import, while `@ness/core` remains the client runtime and a compatibility facade for older `@ness/core/*` imports.

| Package                 | Responsibility                                                        |
| ----------------------- | --------------------------------------------------------------------- |
| `@ness/core`            | React components, navigation hooks, RSC compatibility, legacy exports |
| `@ness/router`          | `ness.config.mjs`, file-system routes, React Router, Vite plugins     |
| `@ness/server`          | Web request handling, middleware, routing rules, response helpers     |
| `@ness/cache`           | cache profiles, SWR, deduplication, tag and path invalidation         |
| `@ness/assets`          | optimized images, local fonts, scripts, metadata and SEO responses    |
| `@ness/instrumentation` | server lifecycle hooks, error hooks, and Core Web Vitals              |
| `@ness/deployment`      | Node, Express, serverless, Edge, health, and shutdown adapters        |
| `@ness/testing`         | route stubs, requests, isolated caches, and response assertions       |

## Imports

```js
import { defineNessConfig, nessRoutes } from '@ness/router';
import { ness } from '@ness/router/vite';
import { createNessRequestHandler } from '@ness/server';
import { cached, revalidateTag } from '@ness/cache';
import { Image } from '@ness/assets/image';
import { defineMetadata } from '@ness/assets/metadata';
```

The more specific asset entry points keep server-only dependencies out of browser bundles:

```js
import { Image } from '@ness/assets/image';
import { createImageHandler } from '@ness/assets/image/server';
import { localFont } from '@ness/assets/font';
import { Script } from '@ness/assets/script';
```

## Migration from `@ness/core/*`

The old entry points continue to re-export the new packages, so the migration can be incremental. Prefer the direct form in new code:

```diff
- import { cached } from '@ness/core/cache';
+ import { cached } from '@ness/cache';

- import { defineNessConfig } from '@ness/core/config';
+ import { defineNessConfig } from '@ness/router';

- import { Image } from '@ness/core/image';
+ import { Image } from '@ness/assets/image';
```
