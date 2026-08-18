import Counter from './counter';

/**
 * `'use server'` called directly from a `'use client'` component — no
 * `<Form>` involved. `Counter` imports and calls `recordClick` from
 * `./actions.ts` straight from the browser; the server executes it and
 * returns real state (see `data-testid="rsc-demo-result"` once clicked).
 */
export default function ServerActionDemoPage() {
  return (
    <main className="shell">
      <h1>Server action from a client component</h1>
      <p>
        The button below is a `&apos;use client&apos;` component that calls a
        `&apos;use server&apos;` function directly — no `&lt;Form&gt;`, no API
        route.
      </p>
      <Counter />
    </main>
  );
}
