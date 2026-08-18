import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export interface ClientOnlyProps {
  /**
   * Optional: rendering only a `fallback` is meaningful — the subtree is
   * server-rendered and then disappears once the browser takes over.
   */
  children?: ReactNode | (() => ReactNode);
  /** Rendered on the server and until hydration. Match its footprint. */
  fallback?: ReactNode;
}

/**
 * True once the component has hydrated in the browser, false during server
 * rendering and on the first client render.
 *
 * The two-pass shape is deliberate. Reading `typeof window` during render
 * would give the server and the first client render different answers, and
 * React would discard the server HTML for that subtree. Committing the change
 * in an effect keeps the first client render identical to the server's.
 */
function useHydrated(): boolean {
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
function ClientOnly({ children, fallback = null }: ClientOnlyProps): ReactNode {
  const hydrated = useHydrated();
  if (!hydrated) return fallback;
  return typeof children === 'function' ? children() : children;
}

export { ClientOnly, useHydrated };
