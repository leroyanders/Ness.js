---
slug: /templates
---

# Official templates

Every official template uses ESM, React Router for UI and SSR, and NestJS controllers under `app/server` for public APIs. Each one also ships `error`, `loading`, and `not-found` boundaries in `app/routes`, and its pages declare their own metadata with `Meta` and `Title` from `@nessframework/components` — plus `Description` where there is one to give — instead of a `meta` route export.

`typescript` is what `ness new` scaffolds when `--template` is left out.

| Alias               | Package                     | Best for                                       |
| ------------------- | --------------------------- | ---------------------------------------------- |
| `typescript` (`ts`) | `@nessframework/typescript` | Strict TypeScript full-stack applications      |
| `javascript` (`js`) | `@nessframework/default`    | The same application without the types         |
| `minimal`           | `@nessframework/minimal`    | Small prototypes with the fewest source files  |
| `api`               | `@nessframework/api`        | NestJS-first services with a small React UI    |
| `dashboard`         | `@nessframework/dashboard`  | Internal tools, consoles, and admin interfaces |

```bash
ness new my-app
ness new my-prototype --template javascript
ness new my-api --template api
ness new my-dashboard --template dashboard
```

`default` is accepted as a third name for the JavaScript starter. It is what `--template` fell back to before TypeScript became the default, so a script that spells it out keeps scaffolding the same thing.

## Minimal

The minimal template contains one page, the three route boundaries, one stylesheet, and a NestJS health controller. It keeps TypeScript strict mode and the production server bridge without example features that need removal later.

## API-first

The API template includes health endpoints and a `users` Nest module with controller, service, module, collection routes, and parameter routes. A request file documents the ready-to-run endpoints.

## Dashboard

The dashboard template includes a responsive navigation shell, KPI cards, an activity table, typed loader data, and a NestJS metrics controller. It uses plain CSS, so a design system can be introduced without first removing a UI dependency.

To publish a company starter or use a directory directly, continue with [Custom and local templates](./your-own-template.md).
