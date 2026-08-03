export const handle = { title: 'Ness.js minimal starter' };
export const meta = () => [
  { name: 'description', content: 'A minimal Ness.js application.' },
];

export default function Home() {
  return (
    <main>
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
