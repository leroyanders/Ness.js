import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router';
import './styles/app.css';

/** The default title. A route's own `meta` replaces it. */
export const meta = () => [{ title: 'Ness.js' }];

export const links = () => [{ rel: 'icon', href: '/favicon.ico' }];

export function Layout({ children }) {
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
        <header className="masthead">
          <div className="shell">
            <Link className="wordmark" to="/">
              <img src="/assets/logo.svg" alt="" width="24" height="24" />
              Ness.js
            </Link>
            <nav>
              <Link to="/about">Route tree</Link>
              <a href="/api/health">API</a>
              <a href="https://nessjs.com/docs">Docs</a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="colophon">
          <div className="shell">
            <a href="https://nessjs.com/docs/documentation/router">Routing</a>
            <a href="https://nessjs.com/docs/documentation/data-fetching">
              Loaders and actions
            </a>
            <a href="https://nessjs.com/docs/documentation/nest">NestJS</a>
            <a href="https://nessjs.com/docs/documentation/deployment">
              Deployment
            </a>
          </div>
        </footer>

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
    <div className="page">
      <div className="shell prose">
        <p className="status">{status}</p>
        <h1>The request did not complete.</h1>
        <p>{message}</p>
        <div className="actions">
          <Link className="primary" to="/">
            Back to the trace
          </Link>
        </div>
      </div>
    </div>
  );
}
