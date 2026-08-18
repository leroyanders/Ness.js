import React, { Suspense, lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useHydrated } from './client-only.js';

/** What `dynamic(() => import('./chart.js'))` accepts as its source. */
export type DynamicLoader<Props> = () => Promise<
  { default: ComponentType<Props> } | ComponentType<Props>
>;

export interface DynamicOptions {
  /** Rendered while the module is on the wire. */
  loading?: ComponentType | (() => ReactNode);
  /**
   * `false` keeps the component out of server rendering entirely: the server
   * (and the first client render) show `loading`, and the real component
   * mounts after hydration. For anything that reads `window` at module scope.
   */
  ssr?: boolean;
}

/**
 * A lazily loaded component, in the shape `next/dynamic` made familiar.
 *
 * ```tsx
 * const Chart = dynamic(() => import('./chart.js'), {
 *   loading: () => <Skeleton />,
 *   ssr: false,
 * });
 * ```
 *
 * `React.lazy` plus a `Suspense` boundary, so the split point is Vite's — the
 * chunk exists because the import is dynamic, not because this wrapper did
 * anything clever. What the wrapper adds is the two conveniences worth
 * standardizing: a declared loading state, and `ssr: false` implemented with
 * the same two-pass hydration rule as `ClientOnly`, so the server HTML and
 * the first client render can never disagree.
 *
 * The loader is normalized to a default export, so both `import('./chart.js')`
 * and `import('./chart.js').then(m => m.Chart)` work.
 */
function dynamic<Props extends object = Record<string, never>>(
  loader: DynamicLoader<Props>,
  { loading, ssr = true }: DynamicOptions = {},
): ComponentType<Props> {
  if (typeof loader !== 'function')
    throw new TypeError('dynamic() expects () => import("...").');

  const Lazy = lazy(async () => {
    const loaded = await loader();
    const component =
      loaded && typeof loaded === 'object' && 'default' in loaded
        ? loaded.default
        : loaded;
    return { default: component as ComponentType<Props> };
  });

  const Fallback = loading;
  const fallback = Fallback ? React.createElement(Fallback) : null;

  function NessDynamic(props: Props): ReactNode {
    // Called unconditionally; only consulted when ssr is off.
    const hydrated = useHydrated();
    if (!ssr && !hydrated) return fallback;
    return React.createElement(
      Suspense,
      { fallback },
      React.createElement(Lazy, props as Props & { children?: never }),
    );
  }
  NessDynamic.displayName = 'Dynamic';
  return NessDynamic as ComponentType<Props>;
}

export { dynamic };
