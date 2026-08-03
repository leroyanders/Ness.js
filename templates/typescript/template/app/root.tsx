import type { ReactNode } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useMatches,
} from 'react-router';
import './styles/app.css';

export const links = () => [
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
];

export function Layout({ children }: { children: ReactNode }) {
  const title = useMatches().reduce((currentTitle, match) => {
    const handle = match.handle as { title?: unknown } | undefined;
    return typeof handle?.title === 'string' ? handle.title : currentTitle;
  }, 'Ness.js — full-stack React framework');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
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
