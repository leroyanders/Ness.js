import { Link } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function About() {
  return (
    <main className="shell">
      <Meta>
        <Title>About · Ness.js</Title>
      </Meta>
      <p className="eyebrow">Nested file route</p>
      <h1>One framework, Web APIs throughout.</h1>
      <p>
        Loaders handle reads, actions handle mutations, and route modules expose
        public HTTP APIs.
      </p>
      <Link to="/">Back home</Link>
    </main>
  );
}
