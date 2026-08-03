import { Link } from 'react-router';

export default function NotFound() {
  return (
    <main className="shell">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <Link to="/">Go home</Link>
    </main>
  );
}
