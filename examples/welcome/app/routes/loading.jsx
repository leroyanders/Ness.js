import { Meta, Title } from '@nessframework/components';

export default function Loading() {
  return (
    <p className="shell loading" role="status">
      <Meta>
        <Title>Loading… · Ness.js</Title>
      </Meta>
      Loading the Ness.js example…
    </p>
  );
}
