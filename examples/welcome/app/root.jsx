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
  { rel: 'preload', href: '/assets/logo.svg', as: 'image' },
];

export function Layout({ children }) {
  const title = useMatches().reduce(
    (currentTitle, match) =>
      typeof match.handle?.title === 'string'
        ? match.handle.title
        : currentTitle,
    'Ness.js — full-stack React framework',
  );

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

export function ErrorBoundary({ error }) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return (
    <main className="shell error-page">
      <p className="eyebrow">Error {status}</p>
      <h1>The request could not be completed.</h1>
      <p>{message}</p>
      <a className="button button-primary" href="/">
        Return home
      </a>
    </main>
  );
}
