---
slug: /templates
---

# Official templates

Every official template uses ESM, React Router for UI and SSR, and NestJS controllers under `app/server` for public APIs.

| Alias        | Package            | Best for                                       |
| ------------ | ------------------ | ---------------------------------------------- |
| `default`    | `@ness/default`    | JavaScript applications and first projects     |
| `typescript` | `@ness/typescript` | Strict TypeScript full-stack applications      |
| `minimal`    | `@ness/minimal`    | Small prototypes with the fewest source files  |
| `api`        | `@ness/api`        | NestJS-first services with a small React UI    |
| `dashboard`  | `@ness/dashboard`  | Internal tools, consoles, and admin interfaces |

```bash
ness new my-app --template minimal
ness new my-api --template api
ness new my-dashboard --template dashboard
```

## Minimal

The minimal template contains one page, one stylesheet, and a NestJS health controller. It keeps TypeScript strict mode and the production server bridge without example features that need removal later.

## API-first

The API template includes health endpoints and a `users` Nest module with controller, service, module, collection routes, and parameter routes. A request file documents the ready-to-run endpoints.

## Dashboard

The dashboard template includes a responsive navigation shell, KPI cards, an activity table, typed loader data, and a NestJS metrics controller. It uses plain CSS, so a design system can be introduced without first removing a UI dependency.

To publish a company starter or use a directory directly, continue with [Custom and local templates](./your-own-template.md).
