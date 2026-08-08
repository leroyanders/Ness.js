import { Meta, Title } from '@nessframework/components';

export default function Loading() {
  return (
    <main role="status">
      <Meta>
        <Title>Loading… · Ness.js</Title>
      </Meta>
      <span className="mark">N</span>
      <p className="eyebrow">Loading</p>
      <h1>Running the loader.</h1>
      <p className="lede">
        This is <code>app/routes/loading.tsx</code>. It renders while the data
        for this segment is still on its way.
      </p>
    </main>
  );
}
