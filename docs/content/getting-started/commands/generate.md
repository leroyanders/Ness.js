# `ness generate`

`ness generate`, or its `g` alias, creates framework-aware modules using the project language. Projects with `tsconfig.json` receive `.ts` and `.tsx`; other projects receive `.js` and `.jsx`.

```bash
ness generate <type> <name> [options]
ness g <type> <name> [options]
```

Names are relative paths, so nested application structure can be generated directly:

```bash
ness g page dashboard/settings
ness g service billing/invoices
ness g component account/avatar
```

## Options

- `--dry-run` prints the destination without writing a file.
- `--force` intentionally replaces an existing destination.

Generation rejects `.` and `..` path segments and refuses to overwrite existing files by default.

## React route schematics

| Schematic      | Alias | Output                               |
| -------------- | ----- | ------------------------------------ |
| `page`         | `p`   | `app/routes/<name>/page.tsx`         |
| `layout`       | `l`   | `app/routes/<name>/layout.tsx`       |
| `route`        | `r`   | `app/routes/<name>/route.ts`         |
| `loading`      |       | `app/routes/<name>/loading.tsx`      |
| `error`        |       | `app/routes/<name>/error.tsx`        |
| `not-found`    |       | `app/routes/<name>/not-found.tsx`    |
| `forbidden`    |       | `app/routes/<name>/forbidden.tsx`    |
| `unauthorized` |       | `app/routes/<name>/unauthorized.tsx` |

`route` creates a low-level React Router resource module. Public application APIs should use a Nest controller.

## NestJS backend schematics

| Schematic    | Aliases         | Output                                   |
| ------------ | --------------- | ---------------------------------------- |
| `controller` | `co`            | `app/server/<name>/<name>.controller.ts` |
| `resource`   | `res`           | `app/server/<name>/<name>.controller.ts` |
| `service`    | `s`, `provider` | `app/server/<name>/<name>.service.ts`    |
| `module`     | `mo`            | `app/server/<name>/<name>.module.ts`     |
| `guard`      | `gu`            | `app/server/<name>/<name>.guard.ts`      |

`controller` creates starter `GET` and `POST` endpoints. `resource` creates CRUD endpoints for collection and `:id` routes. Generated controllers, providers, guards, and modules are registered in the root `AppModule` automatically.

Nest backend schematics always use TypeScript so decorators and dependency-injection metadata are explicit, even when the React application uses JavaScript.

## UI and server schematics

| Schematic    | Aliases | Output                           |
| ------------ | ------- | -------------------------------- |
| `component`  | `c`     | `app/components/<name>.tsx`      |
| `hook`       | `h`     | `app/hooks/<name>.ts`            |
| `context`    | `ctx`   | `app/context/<name>.context.tsx` |
| `action`     | `a`     | `app/actions/<name>.server.ts`   |
| `middleware` | `mi`    | `app/middleware/<name>.ts`       |
| `model`      | `m`     | `app/models/<name>.server.ts`    |

## General schematics

| Schematic   | Alias  | Output                |
| ----------- | ------ | --------------------- |
| `class`     | `cl`   | `app/lib/<name>.ts`   |
| `interface` | `i`    | `app/types/<name>.ts` |
| `enum`      | `e`    | `app/types/<name>.ts` |
| `test`      | `spec` | `test/<name>.test.ts` |

JavaScript interface and enum schematics use JSDoc and frozen objects so the commands remain useful without TypeScript.
