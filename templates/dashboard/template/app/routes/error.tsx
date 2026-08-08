import { useRouteError } from 'react-router';
import { Meta, Title } from '@nessframework/components';

/**
 * The boundary renders the shell around itself rather than only the message.
 * A dashboard that loses its navigation the moment a panel fails leaves the
 * reader with no way out except the back button.
 */
export default function RouteError() {
  const error = useRouteError();

  return (
    <div className="app-shell">
      <Meta>
        <Title>Something went wrong · Ness dashboard</Title>
      </Meta>
      <aside>
        <a className="brand" href="/" aria-label="Ness dashboard home">
          <span>N</span>
          Ness
        </a>
        <nav aria-label="Dashboard navigation">
          <a href="/">Overview</a>
          <a href="/api/dashboard/metrics">Metrics API</a>
        </nav>
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">Route error</p>
            <h1>This view could not be rendered.</h1>
          </div>
        </header>
        <section className="activity">
          <div className="section-title">
            <div>
              <p className="eyebrow">What happened</p>
              <h2>
                {error instanceof Error ? error.message : 'Unknown error'}
              </h2>
            </div>
            <a href="/">Back to the overview</a>
          </div>
        </section>
      </main>
    </div>
  );
}
