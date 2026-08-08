import { Meta, Title } from '@nessframework/components';

export default function Loading() {
  return (
    <main role="status">
      <Meta>
        <Title>Loading… · Ness.js API starter</Title>
      </Meta>
      <header>
        <span className="mark">N</span>
        <div>
          <p className="eyebrow">Loading</p>
          <h1>Fetching the endpoint index.</h1>
          <p>
            This is <code>app/routes/loading.tsx</code>. It covers the React
            side; the API answers its own requests without it.
          </p>
        </div>
      </header>
    </main>
  );
}
