export { Image, Script } from '@nessframework/assets';
export {
  Form,
  Link,
  NavLink,
  PrefetchPageLinks,
  RouteOutlet,
  apiFetch,
  cachedClientLoader,
  clearClientCache,
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
 * Builds a URL from a route pattern and its parameters — `href('/blog/:slug',
 * {slug: 'hello'})`.
 *
 * Worth having only because of what surrounds it: `ness typegen` writes the
 * set of patterns the application actually has into a declaration file, so a
 * pattern that no longer exists — a page renamed, a segment moved — stops
 * type-checking instead of turning into a 404 nobody clicked in review.
 */
function href(path, params = {}) {
  return String(path)
    .replace(/:([A-Za-z0-9_]+)/g, (_match, name) => {
      const value = params[name];
      if (value === undefined)
        throw new Error(`href(${path}) is missing the ${name} parameter.`);
      return encodeURIComponent(String(value));
    })
    .replace(/\*/g, () =>
      params.splat === undefined ? '' : String(params.splat),
    );
}

export { href };
