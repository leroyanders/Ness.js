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
 * - `intent` (default) — on hover or keyboard focus
 * - `render` — as soon as the link is on screen
 * - `none` — not at all
 */
export type PrefetchMode = 'intent' | 'render' | 'none';
export const Link: React.ForwardRefExoticComponent<
  LinkProps & { prefetch?: PrefetchMode } & React.RefAttributes<HTMLAnchorElement>
>;
export const NavLink: React.ForwardRefExoticComponent<
  NavLinkProps & { prefetch?: PrefetchMode } & React.RefAttributes<HTMLAnchorElement>
>;
export function apiFetch(path: string | URL, init?: RequestInit): Promise<Response>;
export function cachedClientLoader<
  T extends (args: any) => Promise<any>,
>(loader: T): T;
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
  push(href: string, options?: Record<string, unknown>): void;
  replace(href: string, options?: Record<string, unknown>): void;
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
