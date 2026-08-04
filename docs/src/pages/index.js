import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const INSTALL = 'npx @nessframework/cli@latest new my-app';

/**
 * The command with a copy button.
 *
 * `navigator.clipboard` is unavailable outside a secure context, so a failure
 * says so instead of silently pretending to have copied — the reader would
 * otherwise paste whatever was on the clipboard before.
 */
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m5 13 4.5 4.5L19 7" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 7v6" />
    <path d="M12 17h.01" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

function InstallCommand() {
  const [state, setState] = useState('idle');
  const timer = useRef(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(INSTALL);
      setState('copied');
    } catch {
      setState('failed');
    }
    timer.current = setTimeout(() => setState('idle'), 2000);
  };

  // The button shows only an icon, so its name has to come from the label —
  // otherwise a screen reader announces nothing but "button".
  const label = {
    idle: `Copy the install command: ${INSTALL}`,
    copied: 'Copied to the clipboard',
    failed: 'Could not copy. Select the command and press ⌘C.',
  }[state];

  const Icon = { idle: CopyIcon, copied: CheckIcon, failed: AlertIcon }[state];

  return (
    <div className={styles.command}>
      <code>{INSTALL}</code>
      <button
        type="button"
        className={styles.copy}
        onClick={copy}
        data-state={state}
        aria-label={label}
        title={label}
      >
        <Icon />
      </button>
      {/* Announced on change; the button's own name is not re-read until focus
          moves, so the result would otherwise be silent. */}
      <span role="status" aria-live="polite" className={styles.srOnly}>
        {state === 'idle' ? '' : label}
      </span>
    </div>
  );
}

/**
 * The hero is the file tree, because the file tree is the argument. A React
 * route and a NestJS controller in one project is the thing no other framework
 * can show you, and it needs no adjectives.
 *
 * `where` marks which side of the request a file runs on, in the same two hues
 * the documentation and the starter page use.
 */
const TREE = [
  { text: 'app/' },
  { text: '├── routes/' },
  { text: '│   ├── page.tsx', where: 'browser', note: 'renders' },
  { text: '│   ├── page.server.ts', where: 'server', note: 'loader, action' },
  { text: '│   └── blog/[slug]/page.tsx', where: 'browser' },
  { text: '└── server/' },
  { text: '    ├── app.module.ts', where: 'server' },
  {
    text: '    └── api.controller.ts',
    where: 'server',
    note: 'GET /api/health',
  },
];

const MEASURED = [
  {
    value: '1.9–2.2×',
    label: 'Throughput on server-rendered routes',
    tone: 'server',
  },
  { value: '2.7×', label: 'Faster production builds', tone: 'deploy' },
  { value: '44%', label: 'Less client JavaScript', tone: 'client' },
  { value: '51%', label: 'Smaller install', tone: 'deploy' },
];

const CAPABILITIES = [
  {
    tone: 'server',
    label: 'Routing',
    title: 'Routes and controllers, one tree',
    body: 'React pages with loaders and actions beside NestJS controllers with modules, guards, and dependency injection. One process, one build, one deployment.',
  },
  {
    tone: 'data',
    label: 'Caching',
    title: 'Caching that survives a second instance',
    body: 'Filesystem, SQLite, and Redis adapters with tag and path invalidation, an optional in-process tier, and eviction broadcast between instances.',
  },
  {
    tone: 'deploy',
    label: 'Deployment',
    title: 'Ships as one directory',
    body: 'ness bundle node traces the production dependency graph and writes a self-contained folder. It runs on a bare Node image with no install step.',
  },
  {
    tone: 'client',
    label: 'Runtime',
    title: 'Web APIs, not wrappers',
    body: 'Loaders and actions receive a Request and return a Response. Middleware, cookies, headers, and redirects are the platform’s, not a framework dialect.',
  },
];

function Tree() {
  return (
    <div
      className={styles.tree}
      role="img"
      aria-label="A Ness.js project: React routes and NestJS controllers in one file tree"
    >
      <div className={styles.treeHead}>a Ness.js project</div>
      <ul className={styles.treeBody}>
        {TREE.map(row => (
          <li key={row.text} className={styles.treeRow}>
            <code>{row.text}</code>
            {row.where ? (
              <span className={styles[row.where]}>{row.note || row.where}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className={styles.treeFoot}>
        <span className={styles.browser}>browser</span>
        <span className={styles.server}>server</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout
      title="Full-stack React with a NestJS backend"
      description="Ness.js runs React routes and NestJS controllers from one filesystem, streams on the server, and deploys as a single self-contained directory."
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Ness.js 7</p>
            <h1>
              One filesystem.
              <span>Both sides of the request.</span>
            </h1>
            <p className={styles.lede}>
              React routes render the interface. NestJS controllers serve the
              API. They live in the same tree, build together, and deploy as one
              directory — without becoming one bundle.
            </p>

            <InstallCommand />

            <div className={styles.actions}>
              <Link
                className={styles.primary}
                to="/docs/getting-started/create-new-app"
              >
                Get started
              </Link>
              <Link className={styles.secondary} to="/docs">
                Read the documentation
              </Link>
            </div>
          </div>

          <Tree />
        </section>

        <section className={styles.measured}>
          <h2 className={styles.sectionLabel}>
            Measured against Next.js on the same application
          </h2>
          <dl className={styles.numbers}>
            {MEASURED.map(item => (
              <div key={item.label} data-tone={item.tone}>
                <dt>{item.value}</dt>
                <dd>{item.label}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.caveat}>
            Both self-hosted on Node, both rendering every request. Ness is
            behind on cold start — 541 ms against 192 ms — and ships a larger
            deployment bundle. The harness is in the repository:{' '}
            <Link to="/docs/documentation/performance">
              see how the numbers are produced
            </Link>
            .
          </p>
        </section>

        <section className={styles.capabilities}>
          <h2 className={styles.sectionLabel}>What you get</h2>
          <div className={styles.grid}>
            {CAPABILITIES.map(item => (
              <article key={item.title} data-tone={item.tone}>
                <p className={styles.cardLabel}>{item.label}</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.close}>
          <h2>Start with a working application.</h2>
          <p>
            Every starter is scaffolded, built, served, bundled, and served
            again from the bundle on every commit.
          </p>
          <Link
            className={styles.primary}
            to="/docs/getting-started/create-new-app"
          >
            Create an application
          </Link>
        </section>
      </main>
    </Layout>
  );
}
