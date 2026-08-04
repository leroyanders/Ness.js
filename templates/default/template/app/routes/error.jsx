import { Link, useRouteError } from 'react-router';

export default function RouteError() {
  const error = useRouteError();

  return (
    <div className="page">
      <div className="shell prose">
        <p className="status">Route error</p>
        <h1>This segment threw.</h1>
        <p>{error?.message || 'Unknown error'}</p>
        <p>
          This is <code>app/routes/error.jsx</code>. It catches anything thrown
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
