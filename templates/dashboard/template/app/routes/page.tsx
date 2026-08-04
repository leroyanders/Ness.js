import { useLoaderData } from 'react-router';

export const meta = () => [{ title: 'Overview · Ness dashboard' }];

export default function Dashboard() {
  const data = useLoaderData<typeof import('./page.server').loader>();
  return (
    <div className="app-shell">
      <aside>
        <a className="brand" href="/" aria-label="Ness dashboard home">
          <span>N</span>
          Ness
        </a>
        <nav aria-label="Dashboard navigation">
          <a className="active" href="/">
            Overview
          </a>
          <a href="/api/dashboard/metrics">Metrics API</a>
          <a href="https://github.com/leroyanders/Ness.js">Documentation</a>
        </nav>
        <div className="account">
          <span>LA</span>
          <div>
            <strong>Leroy Anders</strong>
            <small>Administrator</small>
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">Workspace overview</p>
            <h1>Good afternoon.</h1>
          </div>
          <time dateTime={data.generatedAt}>Live data</time>
        </header>
        <section className="metrics" aria-label="Key metrics">
          {data.metrics.map(metric => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.change} this month</small>
            </article>
          ))}
        </section>
        <section className="activity">
          <div className="section-title">
            <div>
              <p className="eyebrow">Live stream</p>
              <h2>Recent activity</h2>
            </div>
            <a href="/api/dashboard/metrics">View JSON</a>
          </div>
          <div className="table" role="table" aria-label="Recent activity">
            {data.activity.map(item => (
              <div className="row" role="row" key={item.id}>
                <code>{item.id}</code>
                <strong>{item.event}</strong>
                <span>{item.actor}</span>
                <time>{item.time}</time>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
