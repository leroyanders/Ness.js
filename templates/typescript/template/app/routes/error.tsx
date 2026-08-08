import { useRouteError } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function RouteError() {
  const error = useRouteError();
  return (
    <main className="shell">
      <Meta>
        <Title>Route error · Ness.js</Title>
      </Meta>
      <h1>Route failed</h1>
      <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
    </main>
  );
}
