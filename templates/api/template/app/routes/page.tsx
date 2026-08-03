const endpoints = [
  ['GET', '/api/health', 'Liveness and framework information'],
  ['GET', '/api/ready', 'Readiness information'],
  ['GET', '/api/users', 'List users'],
  ['GET', '/api/users/:id', 'Find one user'],
  ['POST', '/api/users', 'Create a user'],
] as const;

export const handle = { title: 'Ness.js API starter' };

export default function Home() {
  return (
    <main>
      <header>
        <span className="mark">N</span>
        <div>
          <p className="eyebrow">Ness.js + NestJS</p>
          <h1>API starter</h1>
          <p>Controllers live in app/server. This page is rendered by React.</p>
        </div>
      </header>
      <section aria-labelledby="endpoints-heading">
        <h2 id="endpoints-heading">Available endpoints</h2>
        <div className="endpoints">
          {endpoints.map(([method, path, description]) => (
            <article key={`${method}:${path}`}>
              <code>{method}</code>
              <a href={path.replace('/:id', '/1')}>{path}</a>
              <span>{description}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
