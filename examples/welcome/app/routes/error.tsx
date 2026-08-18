import { useRouteError } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function RouteError() {
  const error = useRouteError();
  return (
    <main className="shell error-page">
      <Meta>
        <Title>Route error · Ness.js</Title>
      </Meta>
      <p className="eyebrow">Route error</p>
      <h1>This route could not be rendered.</h1>
      <p>{error instanceof Error ? error.message : 'Unknown route error'}</p>
    </main>
  );
}
