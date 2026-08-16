export {
  Form,
  Link,
  NavLink,
  PrefetchPageLinks,
  useParams,
  useSearchParams,
} from 'react-router';
export { Image, Script } from '@nessframework/assets';
export {
  RouteOutlet,
  apiFetch,
  cachedClientLoader,
  clearClientCache,
  prefetch,
  reportWebVitals,
  useNavigationProgress,
  useLinkStatus,
  useOptimisticAction,
  usePathname,
  useReportWebVitals,
  useRouter,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
} from './runtime/client.js';

/**
 * Every route pattern this application has, filled in by `ness typegen` in
 * `app/.ness/routes.d.ts`. Empty here on purpose: a project that has not
 * generated its routes yet still type-checks, with `href` accepting any path.
 */
export interface NessRouteMap {}

export type NessRoutePath = keyof NessRouteMap extends never
  ? string
  : keyof NessRouteMap;

/** Builds a URL from a route pattern and its parameters. */
export function href<Path extends NessRoutePath>(
  path: Path,
  ...params: Path extends keyof NessRouteMap
    ? NessRouteMap[Path] extends Record<string, never>
      ? []
      : [params: NessRouteMap[Path]]
    : [params?: Record<string, string | number>]
): string;
