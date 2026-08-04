---
sidebar_position: 1
---

# Create a new application

Install Node.js 20.19 or newer, then run:

```bash
npx @nessframework/cli@latest new my-app
cd my-app
npm run dev
```

The installed command is also available globally:

```bash
npm install --global @nessframework/cli@latest
ness new my-app
```

`ness new` also has the shorter `ness n` alias. See the [`ness new` reference](./commands/new.md) for every option.

## TypeScript

```bash
ness new my-app --template typescript
```

The TypeScript starter enables strict mode and generates route types into `.react-router/types`.

All official starters include a NestJS backend under `app/server`. Controllers are mounted at `/api` while React Router handles pages and SSR. Choose among the [default, TypeScript, minimal, API-first, and dashboard templates](../templates/index.md).

## Local template

```bash
ness new my-app --template ./path/to/template
```

The directory can contain the application files directly or expose them from a `template/` subdirectory. See [Custom and local templates](../templates/your-own-template.md) for package metadata, dependency merging, and copy-safety rules.

## Experimental React Server Components

```bash
ness new my-app --template typescript --rsc
```

RSC mode supports Server Components, `'use client'`, and `'use server'` functions. It is experimental and can change between minor versions. Prerendering is disabled in RSC mode; standard SSR mode supports prerendering and ISR.

## Next steps

```bash
npm run dev          # development server and HMR
npm run check        # route type generation and TypeScript check
npm run build        # production client/server build
npm run start:prod   # Ness production server
```

Continue with the [CLI command overview](./commands.md) or generate the first route with `ness g page products`.
