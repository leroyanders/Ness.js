import { preload } from 'react-dom';
import { Links, Outlet, Scripts, ScrollRestoration } from 'react-router';
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
  // `preload` rather than a `<link rel="preload">` element: React hoists the
  // element into its own preload section and keeps the rendered one, emitting
  // the same hint twice.
  preload('/assets/logo.svg', { as: 'image' });

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
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
