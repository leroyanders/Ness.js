import type { ReactNode } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from 'react-router';
import './styles/app.css';

export function Layout({ children }: { children: ReactNode }) {
  const title = useMatches().reduce((currentTitle, match) => {
    const handle = match.handle as { title?: unknown } | undefined;
    return typeof handle?.title === 'string' ? handle.title : currentTitle;
  }, 'Ness.js minimal starter');

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
