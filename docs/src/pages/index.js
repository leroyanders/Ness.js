import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const capabilities = [
  {
    label: 'Routing',
    title: 'The filesystem is the architecture.',
    description:
      'React pages and NestJS controllers stay in one application without collapsing into one bundle.',
  },
  {
    label: 'Server data',
    title: 'Request and Response all the way down.',
    description:
      'Loaders and actions use standard Web APIs, with typed route data and progressive enhancement built in.',
  },
  {
    label: 'Delivery',
    title: 'Stream first. Cache with intent.',
    description:
      'SSR, prerendering, ISR and tagged invalidation share one predictable production runtime.',
  },
];

function RoutePanel() {
  return (
    <div
      className={styles.routePanel}
      aria-label="Example Ness.js route manifest"
    >
      <div className={styles.panelHeader}>
        <span className={styles.windowDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>route manifest</span>
        <strong>ready</strong>
      </div>
      <div className={styles.routeBody}>
        <div className={styles.routeRail} aria-hidden="true">
          <span />
        </div>
        <div className={styles.routeRow}>
          <code>/</code>
          <span>page.jsx</span>
          <em>SSR</em>
        </div>
        <div className={styles.routeRow}>
          <code>/docs/:slug</code>
          <span>[slug]/page.tsx</span>
          <em>dynamic</em>
        </div>
        <div className={styles.routeRow}>
          <code>/api/health</code>
          <span>health.controller.ts</span>
          <em>NestJS</em>
        </div>
        <div className={styles.routeRow}>
          <code>/*</code>
          <span>not-found.tsx</span>
          <em>404</em>
        </div>
      </div>
      <div className={styles.panelFooter}>
        <span>streaming SSR</span>
        <span>ISR cache</span>
        <span>NestJS APIs</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout
      title="Full-stack React framework"
      description="Ness.js combines React file routes, NestJS controllers, streaming SSR and a production server runtime."
    >
      <main className={styles.home}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>
                <span>Ness.js 6</span>
                Full-stack React framework
              </p>
              <h1>
                Build React apps that own the <span>whole request.</span>
              </h1>
              <p className={styles.heroLead}>
                Route the interface, server data and public APIs from one
                filesystem. Ness keeps the Web platform visible and the
                production runtime included.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryAction} to="/docs/intro">
                  Read the documentation
                </Link>
                <a
                  className={styles.secondaryAction}
                  href="https://github.com/leroyanders/Ness.js"
                >
                  View source
                </a>
              </div>
              <div className={styles.installCommand}>
                <span>$</span>
                <code>npm install -g @ness/cli</code>
                <small>Node 16+</small>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.brandOrb} aria-hidden="true">
                <img src="/img/logo.svg" alt="" />
              </div>
              <RoutePanel />
            </div>
          </div>
        </section>

        <section className={styles.manifestSection}>
          <div className={styles.sectionHeading}>
            <p>One application, end to end</p>
            <h2>The framework stays out of the platform’s way.</h2>
          </div>
          <div className={styles.capabilityGrid}>
            {capabilities.map(capability => (
              <article className={styles.capability} key={capability.label}>
                <span>{capability.label}</span>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
                <Link to="/docs/documentation/router">
                  Explore the primitive →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.cliSection}>
          <div className={styles.cliCopy}>
            <p className={styles.kicker}>One CLI for the workflow</p>
            <h2>From empty directory to production route tree.</h2>
            <p>
              Create the app, add official plugins, generate route and server
              modules, update packages, verify configuration and serve the same
              build you deploy.
            </p>
            <Link
              className={styles.textAction}
              to="/docs/getting-started/commands"
            >
              Explore the Ness CLI
            </Link>
          </div>
          <div className={styles.terminal} aria-label="Ness CLI example">
            <div className={styles.terminalBar}>
              <span>ness — zsh</span>
              <span>●</span>
            </div>
            <pre>
              <code>
                <span className={styles.prompt}>$</span> ness new studio
                --template typescript
                {'\n'}
                <span className={styles.success}>✓</span> Installed @ness/core
                and @ness/cli
                {'\n'}
                <span className={styles.prompt}>$</span> ness g controller users
                {'\n'}
                <span className={styles.success}>✓</span>{' '}
                app/server/users/users.controller.ts
                {'\n'}
                <span className={styles.prompt}>$</span> ness add tailwind --dev
              </code>
            </pre>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <span>Ness.js v6</span>
            <h2>Use React on both sides of the response.</h2>
          </div>
          <Link
            className={styles.primaryAction}
            to="/docs/getting-started/create-new-app"
          >
            Create an application
          </Link>
        </section>
      </main>
    </Layout>
  );
}
