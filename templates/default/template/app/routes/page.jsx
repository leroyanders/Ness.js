import { Link, useLoaderData } from 'react-router';

export const handle = { title: 'Ness.js — full-stack React framework' };
export const meta = () => [
  { name: 'description', content: 'A production-ready Ness.js application.' },
];

export default function Home() {
  const framework = useLoaderData();
  return (
    <main className="shell">
      <nav>
        <img src="/assets/logo.svg" alt="Ness.js" />
        <Link to="/about">About</Link>
      </nav>
      <section className="hero">
        <p className="eyebrow">Ness.js {framework.version}</p>
        <h1>Ship the server and the interface together.</h1>
        <p>
          File routes, streaming SSR, typed data, actions, caching and
          deployment adapters are ready.
        </p>
        <div className="actions">
          <a href="https://nessjs.com">Documentation</a>
          <Link to="/about">Explore the app</Link>
        </div>
      </section>
    </main>
  );
}
