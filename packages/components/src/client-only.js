import { useEffect, useState } from 'react';

/**
 * True once the component has hydrated in the browser, false during server
 * rendering and on the first client render.
 *
 * The two-pass shape is deliberate. Reading `typeof window` during render
 * would give the server and the first client render different answers, and
 * React would discard the server HTML for that subtree. Committing the change
 * in an effect keeps the first client render identical to the server's.
 */
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/**
 * Renders `children` only after hydration.
 *
 * For the genuinely browser-only: a chart that measures the DOM, anything
 * reading `window`, a widget whose markup depends on the local time zone.
 * `fallback` is what the server renders, so give it the same footprint as the
 * real content to avoid a layout shift.
 */
function ClientOnly({ children, fallback = null }) {
  const hydrated = useHydrated();
  if (!hydrated) return fallback;
  return typeof children === 'function' ? children() : children;
}

export { ClientOnly, useHydrated };
