import { Link } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function NotFound() {
  return (
    <div className="app-shell">
      <Meta>
        <Title>Not found · Ness dashboard</Title>
      </Meta>
      <aside>
        <Link className="brand" to="/" aria-label="Ness dashboard home">
          <span>N</span>
          Ness
        </Link>
        <nav aria-label="Dashboard navigation">
          <Link to="/">Overview</Link>
          <a href="/api/dashboard/metrics">Metrics API</a>
        </nav>
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">404</p>
            <h1>No view at this address.</h1>
          </div>
        </header>
        <section className="activity">
          <div className="section-title">
            <div>
              <p className="eyebrow">Where to next</p>
              <h2>The overview has the metrics and the activity stream.</h2>
            </div>
            <Link to="/">Back to the overview</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
