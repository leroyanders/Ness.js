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

That gives you the TypeScript starter: strict mode on, and route types generated into `.react-router/types`.

`ness new` also has the shorter `ness n` alias. See the [`ness new` reference](./commands/new.md) for every option.

## JavaScript

```bash
ness new my-app --template javascript
```

The same application without the types. `js` and `default` are accepted as well — `default` is what `--template` fell back to before TypeScript became the default, and it still scaffolds this starter.

All official starters include a NestJS backend under `app/server`. Controllers are mounted at `/api` while React Router handles pages and SSR. Choose among the [TypeScript, JavaScript, minimal, API-first, and dashboard templates](../templates/index.md).

## Local template

```bash
ness new my-app --template ./path/to/template
```

The directory can contain the application files directly or expose them from a `template/` subdirectory. See [Custom and local templates](../templates/your-own-template.md) for package metadata, dependency merging, and copy-safety rules.

## React Server Components

RSC is the default rendering mode — `ness new my-app` already gets it. It supports Server Components, `'use client'`, and `'use server'` functions, and every production feature classic mode has: NestJS controllers, the `ness-manifest.json` build manifest, standalone bundling, and `router.prerender` / SSG. See [React Server Components](../documentation/rsc.md) for the authoring model and its one current caveat (hydrating a route whose page component is itself `async`).

It still sits on two upstream APIs that are themselves pre-stable — `@vitejs/plugin-rsc` (0.x) and React Router's `unstable_reactRouterRSC` — and can change between minor versions as a result. Pass `--no-rsc` to scaffold the classic SSR mode instead, which avoids that dependency entirely:

```bash
ness new my-app --no-rsc
```

## Next steps

```bash
npm run dev          # development server and HMR
npm run check        # route type generation and TypeScript check
npm run build        # production client/server build
npm run start:prod   # Ness production server
```

Continue with the [CLI command overview](./commands.md) or generate the first route with `ness g page products`.
