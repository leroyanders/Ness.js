---
sidebar_position: 2
---

# @ness/nest

`@ness/nest` integrates a NestJS 10 application into Ness development and production servers.

## Installation

New Ness applications include the integration. Add it to an existing application with:

```bash
ness add @ness/nest
npm install @nestjs/common@10.4.22 @nestjs/core@10.4.22 reflect-metadata@0.2.2 rxjs@7.8.2
```

## Unified integration

```js title="ness.config.mjs"
import { defineNessConfig } from '@ness/router';
import { ness } from '@ness/router/vite';
import nest from '@ness/nest';
import { nestServer } from '@ness/nest/server';

export default defineNessConfig({
  vite: { plugins: [ness({ plugins: [nest()] })] },
  server: { configureServer: nestServer({ prefix: 'api' }) },
});
```

The Vite integration discovers `app/server/app.module.ts`, compiles Nest decorators and metadata, mounts controllers during development, and watches backend sources. Build output is written to `build/nest`; the production bridge mounts it on the existing Ness server, so no secondary port or proxy is required.

The route prefix defaults to `api` and must remain non-empty, preserving React Router fallthrough for every URL outside the Nest namespace.

See [NestJS backend](../documentation/nest.md) for controllers, services, modules, DI, and CLI generators.
