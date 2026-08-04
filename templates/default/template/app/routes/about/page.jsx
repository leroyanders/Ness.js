import { Link } from 'react-router';

export const meta = () => [{ title: 'Route tree · Ness.js' }];

const TREE = `app/
├── root.jsx              document shell
├── routes.js             generates the tree below
├── routes/
│   ├── page.jsx          /
│   ├── page.server.js    loader and action for /
│   ├── loading.jsx       shown while the loader runs
│   ├── error.jsx         catches a thrown error
│   ├── not-found.jsx     renders a 404
│   └── about/
│       └── page.jsx      /about
└── server/
    ├── app.module.js     NestJS root module
    └── api.controller.js /api/health`;

export default function About() {
  return (
    <div className="page">
      <div className="shell prose">
        <p className="status">Nested file route</p>
        <h1>Every file here is a URL or a handler.</h1>
        <p>
          This page is <code>app/routes/about/page.jsx</code>. Adding a folder
          adds a segment; adding a <code>page</code> to it adds a URL.
        </p>

        <pre className="tree">{TREE}</pre>

        <p>
          Server code stays in <code>page.server.js</code> and{' '}
          <code>app/server</code>, so it never reaches the browser bundle.
          Importing a <code>.server</code> file from a component is a build
          error rather than a silent leak.
        </p>

        <div className="actions">
          <Link className="primary" to="/">
            Back to the trace
          </Link>
          <a href="/api/health">Call the API directly</a>
        </div>
      </div>
    </div>
  );
}
