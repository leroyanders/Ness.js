import { Link, useRouteError } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function RouteError() {
  // `useRouteError` answers with whatever was thrown, which may be an Error, a
  // Response, or anything else a loader decided to throw.
  const error = useRouteError() as { message?: string } | undefined;

  return (
    <div className="page">
      <Meta>
        <Title>Route error · Ness.js</Title>
      </Meta>
      <div className="shell prose">
        <p className="status">Route error</p>
        <h1>This segment threw.</h1>
        <p>{error?.message || 'Unknown error'}</p>
        <p>
          This is <code>app/routes/error.tsx</code>. It catches anything thrown
          by the loader, the action, or the component in its segment, and the
          rest of the page keeps rendering.
        </p>
        <div className="actions">
          <Link className="primary" to="/">
            Back to the trace
          </Link>
        </div>
      </div>
    </div>
  );
}
