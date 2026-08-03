import { useRouteError } from 'react-router';

export default function RouteError() {
  const error = useRouteError();
  return (
    <main className="shell">
      <h1>Route failed</h1>
      <p>{error?.message || 'Unknown error'}</p>
    </main>
  );
}
