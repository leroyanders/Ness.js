import { Description, Meta, Title } from '@nessframework/components';

export default function Home() {
  return (
    <main>
      <Meta>
        <Title>Ness.js minimal starter</Title>
        <Description>A minimal Ness.js application.</Description>
      </Meta>
      <span className="mark">N</span>
      <p className="eyebrow">Ness.js minimal</p>
      <h1>Small surface. Full stack.</h1>
      <p className="lede">
        React Router renders the interface. NestJS owns the server routes.
      </p>
      <div className="actions">
        <a href="/api/health">Check the API</a>
        <a href="https://github.com/leroyanders/Ness.js">View source</a>
      </div>
    </main>
  );
}
