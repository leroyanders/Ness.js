import { Meta, Title } from '@nessframework/components';

/**
 * A skeleton with the same footprint as the overview: four metric cards and
 * four activity rows. A fallback shorter than what replaces it makes the page
 * jump the moment the loader returns, which is worse than showing nothing.
 *
 * The labels are the real ones, from app/server/dashboard/dashboard.data.ts.
 * They never come from the loader — only the numbers do — so showing them
 * immediately is both accurate and one less thing to swap out.
 */
export default function Loading() {
  return (
    <div className="app-shell">
      <Meta>
        <Title>Loading… · Ness dashboard</Title>
      </Meta>
      <aside>
        <span className="brand">
          <span>N</span>
          Ness
        </span>
      </aside>
      <main role="status" aria-busy="true">
        <header>
          <div>
            <p className="eyebrow">Workspace overview</p>
            <h1>Loading…</h1>
          </div>
        </header>
        <section className="metrics" aria-label="Key metrics">
          {[
            'Monthly revenue',
            'Active accounts',
            'Conversion',
            'API uptime',
          ].map(label => (
            <article key={label}>
              <span>{label}</span>
              <strong>—</strong>
              <small>Loading…</small>
            </article>
          ))}
        </section>
        <section className="activity">
          <div className="section-title">
            <div>
              <p className="eyebrow">Live stream</p>
              <h2>Recent activity</h2>
            </div>
          </div>
          <div className="table" role="table" aria-label="Recent activity">
            {[0, 1, 2, 3].map(row => (
              <div className="row" role="row" key={row}>
                <code>—</code>
                <strong>Loading…</strong>
                <span>—</span>
                <time>—</time>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
