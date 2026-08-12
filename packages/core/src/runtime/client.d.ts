import type { ReactElement, ReactNode } from 'react';

export {
  Form,
  Link,
  NavLink,
  PrefetchPageLinks,
  useParams,
  useSearchParams,
} from 'react-router';
export function apiFetch(path: string | URL, init?: RequestInit): Promise<Response>;
export function cachedClientLoader<
  T extends (args: any) => Promise<any>,
>(loader: T): T;
export function clearClientCache(): void;
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
