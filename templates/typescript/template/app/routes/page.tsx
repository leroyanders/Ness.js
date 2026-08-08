import { Link, useLoaderData } from 'react-router';
import { Description, Meta, Title } from '@nessframework/components';

export default function Home() {
  const framework = useLoaderData<typeof import('./page.server').loader>();
  return (
    <main className="shell">
      <Meta>
        <Title>Ness.js — full-stack React framework</Title>
        <Description>A production-ready Ness.js application.</Description>
      </Meta>
      <nav>
        <img src="/assets/logo.svg" alt="Ness.js" />
        <Link to="/about">About</Link>
      </nav>
      <section className="hero">
        <p className="eyebrow">{framework.name}</p>
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
