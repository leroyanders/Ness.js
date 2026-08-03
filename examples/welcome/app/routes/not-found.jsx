import { Link } from 'react-router';

export default function NotFound() {
  return (
    <main className="shell error-page">
      <p className="eyebrow">404</p>
      <h1>There is no route at this address.</h1>
      <Link className="button button-primary" to="/">
        Return home
      </Link>
    </main>
  );
}
