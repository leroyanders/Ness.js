# Server rendering

Ness renders HTML with React streaming SSR. Route loaders run on the server, the shell can be flushed before slower `<Suspense>` content, and the browser hydrates the same route tree.

`app/root.tsx` owns the document. It is one default-exported component that renders the whole document with `<Outlet />` inside it — there is no `Layout` export, and no root `ErrorBoundary`:

```tsx
import { Links, Outlet, Scripts, ScrollRestoration } from 'react-router';

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

`<Links />` stays, because stylesheets are the framework's to inject. There is no `<Meta />`: a page declares its own metadata with the components from `@nessframework/components`, which React hoists into `<head>` from anywhere in the tree. See [Components](../components.md).

Keep `<title>` out of the root. React does not deduplicate it, and the browser takes the first one in the document, so a root title would silently win over every page's own.

Errors are caught by the route-level `error.tsx` that every starter ships, which renders inside the `<Outlet />` and therefore inside the document. That boundary covers its own segment: `app/routes/error.tsx` catches what the routes in `app/routes` throw, and a nested directory needs its own `error.tsx`, or an `app/routes/layout.tsx` above it, to be covered as well. Anything that escapes every boundary falls to React Router's built-in error page, which renders a document of its own.

The default entry handles abort signals, bots, stream errors, serialized loader data, CSP-aware scripts, and hydration. Use `ness reveal entry.server` when you need a custom nonce, stream timeout, or renderer.

In production, `ness start` serves immutable assets, public files, SSR or RSC responses, page caching, image optimization, and `/_ness/health`.

It also negotiates `Accept-Encoding` on the way out, serving the `.br` or `.gz` twin sitting next to a static asset when the client will take it and compressing the rendered response otherwise. With `server.trustProxy` on, `X-Forwarded-Proto` and `X-Forwarded-Host` are applied to `request.url` before the request is handled, so loaders and redirects see the address the visitor used. On `SIGTERM` the health route starts reporting 503 and in-flight requests are drained before the process exits.
