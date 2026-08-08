import { Link, Links, Outlet, Scripts, ScrollRestoration } from 'react-router';
import './styles/app.css';

/**
 * The whole document, in one component.
 *
 * There is no separate `Layout` export. React Router treats that name
 * specially — it wraps the default export, the ErrorBoundary and the
 * HydrateFallback — which means the document shell lives in a component you
 * never render yourself and cannot follow by reading the file top to bottom.
 * Rendering `<Outlet />` inside the document here says the same thing without
 * the convention.
 *
 * Metadata is written as elements rather than a `meta` export. React hoists
 * `<title>`, `<meta>` and `<link>` into `<head>` from anywhere in the tree, so a
 * page states its own title in its own markup.
 *
 * Deliberately no `<title>` here. React hoists every one it finds and does not
 * deduplicate them, so a title in this file would be emitted ahead of the
 * page's — and a browser takes the first. Every page carries its own instead.
 * `<Links />` stays: stylesheets are the framework's to inject.
 */
export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
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

        <Outlet />

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
