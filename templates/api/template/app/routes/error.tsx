import { useRouteError } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function RouteError() {
  const error = useRouteError();

  return (
    <main>
      <Meta>
        <Title>Route error · Ness.js API starter</Title>
      </Meta>
      <header>
        <span className="mark">N</span>
        <div>
          <p className="eyebrow">Route error</p>
          <h1>This page threw.</h1>
          <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </header>
      <section>
        <p>
          This boundary covers the React side only. A controller under{' '}
          <code>app/server</code> returns its own status and body, and never
          reaches this page.
        </p>
        <a href="/">Back to the endpoint index</a>
      </section>
    </main>
  );
}
