import { Link } from 'react-router';
import { Description, Meta, Title } from '@nessframework/components';

export default function About() {
  return (
    <main className="shell content-page">
      <Meta>
        <Title>Architecture · Ness.js</Title>
        <Description>How the Ness.js example is structured.</Description>
      </Meta>
      <p className="eyebrow">Nested file route</p>
      <h1>A small application with production boundaries.</h1>
      <p className="lead">
        Routes live in <code>app/routes</code>. UI, server data and HTTP
        endpoints stay close together while the generated route manifest keeps
        them split at build time.
      </p>
      <div className="architecture-grid">
        <article>
          <strong>page.tsx</strong>
          <span>UI and metadata</span>
        </article>
        <article>
          <strong>page.server.ts</strong>
          <span>Loader and action</span>
        </article>
        <article>
          <strong>route.ts</strong>
          <span>Public HTTP handlers</span>
        </article>
        <article>
          <strong>middleware.ts</strong>
          <span>Request lifecycle</span>
        </article>
      </div>
      <Link className="button" to="/">
        Back to the example
      </Link>
    </main>
  );
}
