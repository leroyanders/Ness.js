import { Link } from 'react-router';
import { Meta, Title } from '@nessframework/components';

export default function NotFound() {
  return (
    <main>
      <Meta>
        <Title>Not found · Ness.js</Title>
      </Meta>
      <span className="mark">N</span>
      <p className="eyebrow">404</p>
      <h1>There is no route here.</h1>
      <p className="lede">
        Routes come from the files in <code>app/routes</code>.
      </p>
      <div className="actions">
        <Link to="/">Back to the start</Link>
      </div>
    </main>
  );
}
