# Migrating from Next.js

```bash
ness migrate next            # in the Next.js project
ness migrate next --dry-run  # print the plan without touching a file
```

The command requires a clean git working tree, so the migration can be reviewed as a diff. It writes `MIGRATION.md` listing every file it moved, every import it rewrote, and everything left for you.

Only the App Router is migrated. Convert a Pages Router project to the App Router in Next first.

## What carries over unchanged

The route conventions are nearly the same, which is what makes this mechanical rather than a rewrite:

| Next.js                                                   | Ness.js                        |
| --------------------------------------------------------- | ------------------------------ |
| `app/page.tsx`                                            | `app/routes/page.tsx`          |
| `app/layout.tsx` (nested)                                 | `app/routes/.../layout.tsx`    |
| `app/layout.tsx` (root)                                   | `app/root.tsx`                 |
| `app/loading.tsx`                                         | `app/routes/.../loading.tsx`   |
| `app/template.tsx`                                        | `app/routes/.../template.tsx`  |
| `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`      | same names under `app/routes/` |
| `app/error.tsx`                                           | `app/routes/.../error.tsx`     |
| `app/not-found.tsx`                                       | `app/routes/.../not-found.tsx` |
| `app/forbidden.tsx`, `app/unauthorized.tsx`               | same names under `app/routes/` |
| `app/api/x/route.ts`                                      | `app/routes/api/x/route.ts`    |
| `[id]`, `[...rest]`, `[[...rest]]`, `(group)`, `_private` | identical                      |

Route Handlers keep their shape too: a `route` module exporting `GET`, `POST`, and so on is dispatched by method in both frameworks.

## Imports rewritten automatically

| Next.js                 | Ness.js                    | Note                              |
| ----------------------- | -------------------------- | --------------------------------- |
| `next/link`             | `react-router`             | `href` becomes `to`               |
| `next/image`            | `@nessframework/core`      |                                   |
| `next/script`           | `@nessframework/core`      |                                   |
| `next/navigation` hooks | `@nessframework/core`      | same names                        |
| `next/cache`            | `@nessframework/cache`     | `unstable_cache` becomes `cached` |
| `next/font/local`       | `@nessframework/core/font` |                                   |

## What needs a human

These are reported, not guessed at. A codemod that silently reshapes code it did not fully understand is worse than one that tells you what it skipped.

**Server Components.** A Next `async` page component becomes a `loader` in an adjacent `page.server` file plus a synchronous component reading `useLoaderData()`. The split depends on what the component awaits.

```tsx
// Next
export default async function Page() {
  const products = await db.product.findMany();
  return <List products={products} />;
}
```

```ts title="app/routes/page.server.ts"
export async function loader() {
  return db.product.findMany();
}
```

```tsx title="app/routes/page.tsx"
export default function Page() {
  return <List products={useLoaderData()} />;
}
```

**Server Actions.** A `"use server"` function becomes an `action` export in `page.server`, submitted through `<Form>`.

**`redirect()` and `notFound()`.** In Ness these are thrown from a loader or action, from `@nessframework/core/server/responses`.

**`cookies()` and `headers()`.** Next reads these from an implicit request. Read them from the `request` argument your loader or action already receives.

**`NextRequest` / `NextResponse`.** These are the Web-standard `Request` and `Response` globals in Ness; drop the import.

**`generateStaticParams`.** List the paths under `router.prerender` in `ness.config.mjs`.

**`generateMetadata`.** There is no `meta` route export in Ness. A page declares its metadata in its own markup with `Meta`, `Title`, `Description`, `Canonical`, `Robots`, and `SocialImage` from `@nessframework/components`; React hoists the tags into `<head>`. See [Components](./components.md).

**`next.config.js`.** `redirects`, `rewrites`, `headers`, and `images` move into the `server` section of `ness.config.mjs`; the option shapes match.

**Middleware.** Next middleware runs once per request. Ness middleware is scoped to a route segment — usually a closer fit, but the placement has to be chosen.

## After migrating

```bash
ness typegen
ness build
```

Review the diff, work through `MIGRATION.md`, then delete it.
