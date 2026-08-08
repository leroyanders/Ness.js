import { Link } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function NotFound() {
  return (
    <main>
      <Meta>
        <Title>Not found · Ness.js API starter</Title>
      </Meta>
      <header>
        <span className="mark">N</span>
        <div>
          <p className="eyebrow">404</p>
          <h1>No route at this address.</h1>
          <p>
            Pages come from <code>app/routes</code>; the API comes from{' '}
            <code>app/server</code>. An unknown <code>/api</code> path is
            answered by NestJS, not by this page.
          </p>
        </div>
      </header>
      <section>
        <Link to="/">Back to the endpoint index</Link>
      </section>
    </main>
  );
}
