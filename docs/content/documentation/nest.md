# NestJS backend

Ness uses NestJS for public server routes while React Router handles the UI, loaders, actions, and SSR. Both frameworks run on the same HTTP server: Nest controllers are mounted first and unmatched requests continue to the React application.

## Project structure

```text
app/
├── routes/                     # React pages, layouts, loaders, actions
└── server/                     # NestJS backend
    ├── app.module.ts
    └── users/
        ├── users.controller.ts
        ├── users.service.ts
        └── users.module.ts
```

New applications include `@nessframework/nest`, NestJS 11, `reflect-metadata`, and RxJS. NestJS 11 and Express 5 must be used together: `@nestjs/platform-express@11` calls Express 5 APIs, and pairing it with Express 4 fails at application start.

`app/server` is TypeScript in every starter, including the JavaScript one. Nest is built on decorators, and decorators do not exist in JavaScript — writing this folder in JavaScript means applying every decorator by hand:

```js
// What JavaScript forces you to write instead of @Get('health')
Get('health')(
  ApiController.prototype,
  'health',
  Object.getOwnPropertyDescriptor(ApiController.prototype, 'health'),
);
```

The JavaScript starter therefore ships a project-root `tsconfig.json` whose `include` is `**/*.ts`, which reaches `app/server` and nothing else: the `.jsx` React side is left alone. Nothing else needs configuring: the Nest compiler transpiles `app/server` on its own, in development and in the build.

## Root module

```ts title="app/server/app.module.ts"
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module.js';

@Module({ imports: [UsersModule] })
export class AppModule {}
```

Use `.js` in relative TypeScript imports. The Nest compiler resolves the source `.ts` file and emits ESM files that Node can load directly.

## Controller and service

```ts title="app/server/users/users.controller.ts"
import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }
}
```

```ts title="app/server/users/users.service.ts"
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll() {
    return [];
  }
}
```

All controllers receive the global `/api` prefix by default. Nest decorators for validation, guards, interceptors, exception filters, versioning, and OpenAPI can be used normally.

## Generate backend modules

```bash
ness g controller users
ness g service users
ness g module users
ness g guard users/auth
ness g resource products
```

The generator writes Nest modules under `app/server` and registers controllers, providers, guards, and imported modules in `app/server/app.module.ts` when it exists.

## Development and production

The `@nessframework/nest` Vite plugin compiles decorators with `emitDecoratorMetadata`, mounts the application during `ness dev`, and reloads it when `app/server` changes. `ness build` writes the ESM backend to `build/nest`.

Both halves are wired in `ness.config.mjs` — the Vite plugin for `ness dev`, the bridge for `ness start`:

```js
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';

export default defineNessConfig({
  vite: { plugins: [ness({ plugins: [nest({ prefix: 'api' })] })] },
  server: { configureServer: nestServer({ prefix: 'api' }) },
});
```

The prefix must be non-empty so unknown URLs can continue to the React application. Change it to another namespace such as `v1` when needed — in both places, or development and production will disagree about where the API is. Both default to `api`.
