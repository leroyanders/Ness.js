export { Image, Script, setImageLoader } from '@nessframework/assets';
export type { ImageLoader } from '@nessframework/assets';
export { dynamic } from '@nessframework/components';
export type { DynamicOptions, Metadata } from '@nessframework/components';
// React's own per-render memoization, under the name everyone knows it by.
export { cache } from 'react';
export {
  Form,
  Link,
  NavLink,
  PrefetchPageLinks,
  RouteOutlet,
  apiFetch,
  cachedClientLoader,
  clearClientCache,
  closeInterceptedRoute,
  prefetch,
  reportWebVitals,
  useLinkStatus,
  useNavigationProgress,
  useOptimisticAction,
  useParams,
  usePathname,
  useReportWebVitals,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
} from './runtime/client.js';

/**
 * Every route pattern this application has, filled in by `ness typegen` in
 * `app/.ness/routes.d.ts`. Empty here on purpose: a project that has not
 * generated its routes yet still type-checks, with `href` accepting any path.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NessRouteMap {}

export type NessRoutePath = keyof NessRouteMap extends never
  ? string
  : keyof NessRouteMap;

/**
 * Builds a URL from a route pattern and its parameters — `href('/blog/:slug',
 * {slug: 'hello'})`.
 *
 * Worth having only because of what surrounds it: `ness typegen` writes the
 * set of patterns the application actually has into a declaration file, so a
 * pattern that no longer exists — a page renamed, a segment moved — stops
 * type-checking instead of turning into a 404 nobody clicked in review.
 */
export function href<Path extends NessRoutePath>(
  path: Path,
  ...params: Path extends keyof NessRouteMap
    ? NessRouteMap[Path] extends Record<string, never>
      ? []
      : [params: NessRouteMap[Path]]
    : [params?: Record<string, string | number>]
): string;
export function href(
  path: string,
  params: Record<string, string | number> = {},
): string {
  return String(path)
    .replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
      const value = params[name];
      if (value === undefined)
        throw new Error(`href(${path}) is missing the ${name} parameter.`);
      return encodeURIComponent(String(value));
    })
    .replace(/\*/g, () =>
      params['splat'] === undefined ? '' : String(params['splat']),
    );
}
