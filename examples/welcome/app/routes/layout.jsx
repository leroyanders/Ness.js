import { Link, Outlet } from 'react-router';

export default function SiteLayout() {
  return (
    <>
      <header className="site-header shell">
        <Link className="brand" to="/" aria-label="Ness.js home">
          <img src="/assets/logo.svg" alt="" />
          <span>Ness.js</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link to="/about">Architecture</Link>
          <a href="/api/health">API health</a>
          <a href="https://github.com/leroyanders/Ness.js">GitHub</a>
        </nav>
      </header>
      <Outlet />
      <footer className="site-footer shell">
        <span>Ness.js example</span>
        <span>React and NestJS, one runtime.</span>
      </footer>
    </>
  );
}
