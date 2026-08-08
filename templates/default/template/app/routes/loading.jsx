import { Meta, Title } from '@nessframework/components';

export default function Loading() {
  return (
    <div className="page">
      <Meta>
        <Title>Loading… · Ness.js</Title>
      </Meta>
      <div className="shell prose" role="status">
        <p className="status">Loading</p>
        <h1>Running the loader.</h1>
        <p>
          This is <code>app/routes/loading.jsx</code>. It renders while the
          loader for this segment is still running.
        </p>
      </div>
    </div>
  );
}
