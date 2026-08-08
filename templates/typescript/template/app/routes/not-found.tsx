import { Link } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function NotFound() {
  return (
    <main className="shell">
      <Meta>
        <Title>Not found · Ness.js</Title>
      </Meta>
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <Link to="/">Go home</Link>
    </main>
  );
}
