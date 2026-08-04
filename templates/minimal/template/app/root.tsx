import type { ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import './styles/app.css';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* No literal <title> here on purpose: <Meta /> renders it from the
          route's meta export. A hard-coded one would come first in the
          document and freeze every page on the same title. */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
