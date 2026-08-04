import { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router';

export const meta = () => [
  { title: 'Ness.js' },
  {
    name: 'description',
    content: 'A Ness.js application, rendered on the server.',
  },
];

const time = value => new Date(value).toLocaleTimeString();

/**
 * Calls the NestJS controller from the browser, so the row below finishes
 * filling in after hydration. Watching it resolve is the point: the React route
 * and the Nest controller live in the same project and are both already
 * serving.
 */
function useApiHealth() {
  const [state, setState] = useState({ status: 'pending' });

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/health', { signal: controller.signal })
      .then(async response => {
        setState({
          status: response.ok ? 'ok' : 'failed',
          code: response.status,
          body: response.ok ? await response.json() : undefined,
        });
      })
      .catch(error => {
        if (error.name !== 'AbortError') setState({ status: 'failed' });
      });

    return () => controller.abort();
  }, []);

  return state;
}

function apiRow(health) {
  if (health.status === 'pending') {
    return {
      badge: <span className="where pending">calling</span>,
      note: 'Waiting for the browser to hydrate and fetch /api/health.',
    };
  }
  if (health.status === 'failed') {
    return {
      badge: <span className="where failed">{health.code || 'error'}</span>,
      note: 'The controller did not answer. Check the terminal running ness dev.',
    };
  }
  return {
    badge: <span className="where client">{health.code} browser</span>,
    note: JSON.stringify(health.body),
  };
}

export default function Home() {
  const data = useLoaderData();
  const api = apiRow(useApiHealth());

  return (
    <div className="page">
      <div className="shell">
        <h1 className="lede">
          This page was rendered on the server.{' '}
          <span>Here is everything that handled the request.</span>
        </h1>

        <section className="trace" aria-label="Request trace">
          <header className="trace-head">
            <b>GET {data.pathname}</b>
            <span className="dim">{data.durationMs} ms in the loader</span>
            <span className="dim">node {data.node}</span>
          </header>

          <dl>
            <div className="row">
              <dt>Route</dt>
              <dd>
                app/routes/page.jsx
                <span className="note">
                  Rendered to HTML before the browser ran any JavaScript.
                </span>
              </dd>
            </div>

            <div className="row">
              <dt>Loader</dt>
              <dd>
                app/routes/page.server.js{' '}
                <span className="where server">server</span>
                <span className="note">
                  Served at {time(data.servedAt)}, cached value from{' '}
                  {time(data.renderedAt)}. Reload: one moves, one holds.
                </span>
              </dd>
            </div>

            <div className="row">
              <dt>API</dt>
              <dd>
                app/server/api.controller.js {api.badge}
                <span className="note">{api.note}</span>
              </dd>
            </div>
          </dl>
        </section>

        <p className="next">
          Edit <code>app/routes/page.jsx</code> and save. The page updates
          without a reload.
        </p>

        <div className="actions">
          <a className="primary" href="https://nessjs.com/docs">
            Read the docs
          </a>
          <Link to="/about">See the route tree</Link>
        </div>
      </div>
    </div>
  );
}
