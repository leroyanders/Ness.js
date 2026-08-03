# Server rendering

Ness renders HTML with React streaming SSR. Route loaders run on the server, the shell can be flushed before slower `<Suspense>` content, and the browser hydrates the same route tree.

`app/root.tsx` owns the document:

```tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
```

The default entry handles abort signals, bots, stream errors, serialized loader data, CSP-aware scripts, and hydration. Use `ness reveal entry.server` when you need a custom nonce, stream timeout, or renderer.

In production, `ness start` serves immutable assets, public files, SSR or RSC responses, page caching, image optimization, and `/_ness/health`.
