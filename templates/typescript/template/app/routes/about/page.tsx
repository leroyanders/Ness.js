import { Link } from 'react-router';

export const meta = () => [{ title: 'About · Ness.js' }];

export default function About() {
  return (
    <main className="shell">
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
