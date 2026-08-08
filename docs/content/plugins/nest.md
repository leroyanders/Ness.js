---
sidebar_position: 2
---

# @nessframework/nest

`@nessframework/nest` integrates a NestJS 11 application into Ness development and production servers.

## Installation

New Ness applications include the integration. Add it to an existing application with:

```bash
ness add @nessframework/nest
npm install @nestjs/common@11.1.28 @nestjs/core@11.1.28 reflect-metadata@0.2.2 rxjs@7.8.2
```

## Unified integration

```js title="ness.config.mjs"
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';

export default defineNessConfig({
  vite: { plugins: [ness({ plugins: [nest()] })] },
  server: { configureServer: nestServer({ prefix: 'api' }) },
});
```

The Vite integration discovers `app/server/app.module.ts` — `.mts` and `.js` are accepted too — compiles Nest decorators and metadata, mounts controllers during development, and watches backend sources. Build output is written to `build/nest`; the production bridge mounts it on the existing Ness server, so no secondary port or proxy is required.

The route prefix defaults to `api` and must remain non-empty, preserving React Router fallthrough for every URL outside the Nest namespace.

`nest()` also accepts `source` (the backend directory, default `app/server`), `outDir` (default `build/nest`), and `logger`, the Nest log levels to enable. `nestServer()` accepts the same `prefix` and `logger`, plus `module` — the compiled entry to load, default `build/nest/app.module.js` — when the plugin was built to a different `outDir`.

See [NestJS backend](../documentation/nest.md) for controllers, services, modules, DI, and CLI generators.
