import { useRouteError } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function RouteError() {
  const error = useRouteError();

  return (
    <main>
      <Meta>
        <Title>Route error · Ness.js</Title>
      </Meta>
      <span className="mark">N</span>
      <p className="eyebrow">Route error</p>
      <h1>This route threw.</h1>
      <p className="lede">
        {error instanceof Error ? error.message : 'Unknown error'}
      </p>
      <div className="actions">
        <a href="/">Back to the start</a>
      </div>
    </main>
  );
}
