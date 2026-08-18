import { Link } from 'react-router';
import { Meta, Title } from '@nessframework/components';

const TREE = `app/
├── root.tsx              document shell
├── routes.ts             generates the tree below
├── routes/
│   ├── page.tsx          /
│   ├── page.server.ts    loader and action for /
│   ├── loading.tsx       shown while the loader runs
│   ├── error.tsx         catches a thrown error
│   ├── not-found.tsx     renders a 404
│   └── about/
│       └── page.tsx      /about
└── server/
    ├── app.module.ts     NestJS root module
    └── api.controller.ts /api/health`;

export default function About() {
  return (
    <div className="page">
      <Meta>
        <Title>Route tree · Ness.js</Title>
      </Meta>
      <div className="shell prose">
        <p className="status">Nested file route</p>
        <h1>Every file here is a URL or a handler.</h1>
        <p>
          This page is <code>app/routes/about/page.tsx</code>. Adding a folder
          adds a segment; adding a <code>page</code> to it adds a URL.
        </p>

        <pre className="tree">{TREE}</pre>

        <p>
          Server code stays in <code>page.server.ts</code> and{' '}
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
