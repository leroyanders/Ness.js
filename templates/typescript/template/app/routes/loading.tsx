import { Meta, Title } from '@nessframework/components';

export default function Loading() {
  return (
    <p className="shell" role="status">
      <Meta>
        <Title>Loading… · Ness.js</Title>
      </Meta>
      Loading…
    </p>
  );
}
