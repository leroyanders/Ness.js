import type { ReactNode } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router';
import './styles/app.css';

export const meta = () => [{ title: 'Ness.js — full-stack React framework' }];

export const links = () => [{ rel: 'icon', href: '/favicon.ico' }];

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

export function ErrorBoundary({ error }: { error: unknown }) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Unknown error';
  return (
    <main className="shell">
      <p className="eyebrow">{status}</p>
      <h1>Something went wrong</h1>
      <p>{message}</p>
    </main>
  );
}
