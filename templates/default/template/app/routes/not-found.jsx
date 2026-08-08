import { Link } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function NotFound() {
  return (
    <div className="page">
      <Meta>
        <Title>Not found · Ness.js</Title>
      </Meta>
      <div className="shell prose">
        <p className="status">404</p>
        <h1>Nothing is routed here.</h1>
        <p>
          Create <code>app/routes/&lt;segment&gt;/page.jsx</code> to add this
          URL.
        </p>
        <div className="actions">
          <Link className="primary" to="/">
            Back to the trace
          </Link>
          <Link to="/about">See the route tree</Link>
        </div>
      </div>
    </div>
  );
}
