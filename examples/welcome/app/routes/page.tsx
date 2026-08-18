import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import { Description, Meta, Title } from '@nessframework/components';

/**
 * The shapes `page.server.ts` returns. Stated here rather than imported: a
 * component that imports its `.server` sibling is a build error, which is the
 * whole point of the convention.
 */
interface Framework {
  name: string;
  generatedAt: string;
}

interface SignupResult {
  error?: string;
  subscribed?: string;
}

const capabilities: Array<[title: string, description: string]> = [
  [
    'App Router',
    'Layouts, dynamic segments, NestJS controllers and route-level boundaries.',
  ],
  [
    'Server data',
    'Typed loaders and actions built on Request, Response and FormData.',
  ],
  [
    'Fast delivery',
    'Streaming SSR, prerendering, ISR and tagged cache invalidation.',
  ],
  [
    'Operations',
    'Image optimization, metadata, instrumentation and deployment adapters.',
  ],
];

export default function Home() {
  const framework = useLoaderData() as Framework;
  const actionData = useActionData() as SignupResult | undefined;
  const navigation = useNavigation();
  const subscribing = navigation.state === 'submitting';

  return (
    <main>
      <section className="hero shell">
        <Meta>
          <Title>Ness.js — full-stack React framework</Title>
          <Description>
            A production example built with the Ness.js App Router.
          </Description>
        </Meta>
        <div className="hero-copy">
          <p className="eyebrow">{framework.name}</p>
          <h1>Build the server and the interface as one application.</h1>
          <p className="lead">
            This example runs on the Ness file router with cached server data,
            route actions, middleware and a NestJS API runtime.
          </p>
          <div className="actions">
            <a className="button button-primary" href="https://nessjs.com">
              Read the docs
            </a>
            <Link className="button" to="/about">
              Explore the architecture
            </Link>
          </div>
        </div>
        <aside className="runtime-card">
          <span className="status">
            <i /> Production runtime
          </span>
          <dl>
            <div>
              <dt>Rendering</dt>
              <dd>Streaming SSR</dd>
            </div>
            <div>
              <dt>Router</dt>
              <dd>File conventions</dd>
            </div>
            <div>
              <dt>Cache</dt>
              <dd>ISR + tags</dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{framework.generatedAt}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section
        className="feature-section shell"
        aria-labelledby="features-heading"
      >
        <p className="eyebrow">Framework primitives</p>
        <h2 id="features-heading">
          Everything needed for a production React application.
        </h2>
        <div className="feature-grid">
          {capabilities.map(([title, description], index) => (
            <article className="feature-card" key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-section shell">
        <div>
          <p className="eyebrow">Route action</p>
          <h2>Submit without maintaining a separate API client.</h2>
          <p>
            The form posts to the colocated server action and progressively
            enhances in the browser.
          </p>
        </div>
        <Form className="signup" method="post">
          <label htmlFor="email">Email address</label>
          <div>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
            <button
              className="button button-primary"
              disabled={subscribing}
              type="submit"
            >
              {subscribing ? 'Submitting…' : 'Try the action'}
            </button>
          </div>
          {actionData?.error ? (
            <p className="form-message error">{actionData.error}</p>
          ) : null}
          {actionData?.subscribed ? (
            <p className="form-message success">
              Received {actionData.subscribed} on the server.
            </p>
          ) : null}
        </Form>
      </section>
    </main>
  );
}
