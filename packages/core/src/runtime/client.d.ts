import type * as React from 'react';
import type { ReactElement, ReactNode } from 'react';

import type { LinkProps, NavLinkProps } from 'react-router';

export {
  Form,
  PrefetchPageLinks,
  useParams,
  useSearchParams,
} from 'react-router';

/**
 * How eagerly a link warms the page behind it:
 * - `auto` (default) — once on screen in a build, on hover in development,
 *   and not at all on a metered or slow connection
 * - `intent` — on hover or keyboard focus
 * - `viewport` — once the link is on screen
 * - `render` — as soon as the link exists
 * - `none` — not at all
 */
export type PrefetchMode = 'auto' | 'intent' | 'viewport' | 'render' | 'none';
/** `scroll={false}` is Next's name for react-router's `preventScrollReset`. */
export type NessLinkProps = { prefetch?: PrefetchMode; scroll?: boolean };
export const Link: React.ForwardRefExoticComponent<
  LinkProps & NessLinkProps & React.RefAttributes<HTMLAnchorElement>
>;
export const NavLink: React.ForwardRefExoticComponent<
  NavLinkProps & NessLinkProps & React.RefAttributes<HTMLAnchorElement>
>;
/**
 * Wires a route module together with the `loading.tsx` covering it. Called by
 * generated route modules — an application never writes this itself.
 */
export function streamRoute(
  route: {
    default?: React.ComponentType<any>;
    clientLoader?: ((args: any) => unknown) & { hydrate?: boolean };
  },
  Loading: React.ComponentType,
  options?: {
    id?: string;
    serverLoader?: boolean;
    shouldRevalidate?: (args: any) => boolean;
  },
): {
  Component?: React.ComponentType<any>;
  clientLoader?: (args: any) => unknown;
  shouldRevalidate?: (args: any) => boolean;
};
export function apiFetch(
  path: string | URL,
  init?: RequestInit,
): Promise<Response>;
export function cachedClientLoader<T extends (args: any) => Promise<any>>(
  loader: T,
): T;
export function clearClientCache(): void;
export function prefetchRoute(href: string): Promise<void>;
/** Whether a URL's loader data is already cached — no wait needed to show it. */
export function hasCachedRoute(href: string): boolean;
export function RouteOutlet(props: {
  fallback?: ReactNode | ((pathname: string) => ReactNode);
  context?: unknown;
}): ReactElement;
export interface NavigationProgress {
  location?: Location;
  pending: boolean;
  state: 'idle' | 'loading' | 'submitting';
}
export function useNavigationProgress(): NavigationProgress;
export function useOptimisticAction<State, Action>(
  initialValue: State,
  reducer: (state: State, action: Action) => State,
): [State, (action: Action) => void, boolean];
export function prefetch(
  href: string,
  options?: { signal?: AbortSignal; headers?: HeadersInit },
): Promise<Response>;
export function usePathname(): string;
export interface NessRouter {
  back(): void;
  forward(): void;
  prefetch: typeof prefetch;
  refresh(): void;
  push(
    href: string,
    options?: Record<string, unknown> & { scroll?: boolean },
  ): void;
  replace(
    href: string,
    options?: Record<string, unknown> & { scroll?: boolean },
  ): void;
}
export function useRouter(): NessRouter;
export function useSelectedLayoutSegment(index?: number): string | null;
export function useSelectedLayoutSegments(): string[];
export function useLinkStatus(href: string): { pending: boolean };
export function useReportWebVitals(
  callback: Parameters<typeof reportWebVitals>[0],
): void;
export function reportWebVitals(
  callback: (metric: {
    name: string;
    value: number;
    entry: PerformanceEntry;
  }) => void,
): () => void;
