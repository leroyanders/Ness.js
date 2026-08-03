import { useRouteError } from 'react-router';

export default function RouteError() {
  const error = useRouteError();
  return (
    <main className="shell error-page">
      <p className="eyebrow">Route error</p>
      <h1>This route could not be rendered.</h1>
      <p>{error instanceof Error ? error.message : 'Unknown route error'}</p>
    </main>
  );
}
