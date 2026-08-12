import React from 'react';
import * as router from 'react-router';
import { reportWebVitals } from '@nessframework/instrumentation';

function useNavigationProgress() {
  const navigation = router.useNavigation();
  return {
    location: navigation.location,
    pending: navigation.state !== 'idle',
    state: navigation.state,
  };
}

function useOptimisticAction(initialValue, reducer) {
  const [optimistic, addOptimistic] = React.useOptimistic(
    initialValue,
    reducer,
  );
  const navigation = router.useNavigation();
  return [optimistic, addOptimistic, navigation.state !== 'idle'];
}

function prefetch(href, { signal, headers } = {}) {
  const url = new URL('/__manifest', window.location.origin);
  url.searchParams.set('p', href);
  return fetch(url, { headers, signal, credentials: 'same-origin' });
}

function useRouter() {
  const navigate = router.useNavigate();
  const revalidator = router.useRevalidator();
  return React.useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      prefetch,
      push: (href, options) => navigate(href, options),
      refresh: () => revalidator.revalidate(),
      replace: (href, options) => navigate(href, { ...options, replace: true }),
    }),
    [navigate, revalidator],
  );
}

function useSelectedLayoutSegments() {
  return router.useLocation().pathname.split('/').filter(Boolean);
}

function useSelectedLayoutSegment(index = 0) {
  return useSelectedLayoutSegments()[index] || null;
}

function useLinkStatus(href) {
  const navigation = router.useNavigation();
  return {
    pending:
      navigation.location?.pathname === href && navigation.state !== 'idle',
  };
}

function useReportWebVitals(callback) {
  React.useEffect(() => reportWebVitals(callback), [callback]);
}

const usePathname = () => router.useLocation().pathname;
const { Form, Link, NavLink, PrefetchPageLinks, useParams, useSearchParams } =
  router;

/**
 * Deliberately just `fetch()` — its value is having the same name/shape as
 * the server-side `apiFetch(request, path, init?)` a project typically
 * defines for its own `loader`s, so a `clientLoader` reads the same way as
 * the `loader` beside it instead of switching between two different-looking
 * APIs. Also the one place a project can later add shared client-side
 * behaviour (error handling, a base URL, etc.) without touching every route.
 */
function apiFetch(path, init) {
  return fetch(path, init);
}

/**
 * Keyed by URL, shared across every `cachedClientLoader` in the app.
 * Session-lifetime only — a plain module-scope Map, never persisted, reset
 * on a full reload.
 */
const clientDataCache = new Map();

function clearClientCache() {
  clientDataCache.clear();
}

/**
 * Wraps a `clientLoader` so navigating back to an already-visited URL (a
 * different pathname+search than the one currently on screen) returns the
 * cached result immediately instead of re-fetching.
 *
 * A loader call whose `request.url` matches `window.location` is a
 * *revalidation* of the page already on screen — after a `<Form>` or
 * `useFetcher()` action, React Router re-runs the current route's loader
 * with that same URL. Serving cache there would show stale data on top of
 * a mutation that just happened (and worse, a background refresh's result
 * would never reach `useLoaderData()`, since React Router only accepts
 * loader data from calls it itself awaited). So that case always goes to
 * the network, and simply refreshes the cache entry for next time — the
 * cache is only ever a shortcut for a genuinely different destination.
 *
 * This also means POP navigation (the browser back/forward buttons) never
 * hits the cache: the browser updates `window.location` before any loader
 * runs, so `request.url` already matches it even when returning to a page
 * visited earlier. That's a deliberate, safe trade-off — POP always
 * revalidates, PUSH/REPLACE (clicking a link) benefits from the cache.
 */
function cachedClientLoader(loader) {
  return async args => {
    const target = new URL(args.request.url);
    const targetKey = target.pathname + target.search;
    const currentKey = window.location.pathname + window.location.search;
    if (targetKey !== currentKey && clientDataCache.has(targetKey)) {
      return clientDataCache.get(targetKey);
    }
    const data = await loader(args);
    clientDataCache.set(targetKey, data);
    return data;
  };
}

/**
 * Drop-in replacement for react-router's `<Outlet/>` in a layout route:
 * shows `fallback` during a genuine cross-route pending navigation (a
 * search-param-only change under the same route does not count), and
 * clears the whole `cachedClientLoader` cache once any in-flight mutation
 * — a top-level `<Form>` submission or a `useFetcher()` — finishes. That
 * invalidation is coarse (the entire cache, not just what the mutation
 * actually affected) by design: tracking which cached route depends on
 * which mutation would need every action to declare it, and getting that
 * wrong risks stale data, which is worse than an extra cache miss.
 *
 * There is no way to resolve the fallback of the route being navigated TO
 * (not yet mounted) on react-router 8's stable API — resolving it would
 * need either `matchRoutes()` against react-router's own live tree (which
 * deliberately omits `HydrateFallback` for a lazy route not yet visited)
 * or an `unstable_`/`UNSAFE_`-prefixed API not safe to depend on. So
 * `fallback` is one static element the consumer provides, not
 * auto-resolved per destination — and because it fully replaces `<Outlet/>`
 * while pending, a leaf route's own `HydrateFallback` no longer plays any
 * role in client-side navigation once its layout adopts `RouteOutlet` (it
 * still applies to the first, full-document hydration, same as before).
 */
function RouteOutlet({ fallback, context }) {
  const location = router.useLocation();
  const navigation = router.useNavigation();
  const fetchers = router.useFetchers();
  const wasSubmittingRef = React.useRef(false);

  React.useEffect(() => {
    const isSubmittingNow =
      navigation.state === 'submitting' ||
      fetchers.some(fetcher => fetcher.state === 'submitting');
    if (wasSubmittingRef.current && !isSubmittingNow) clearClientCache();
    wasSubmittingRef.current = isSubmittingNow;
  }, [navigation.state, fetchers]);

  const isPageTransition =
    navigation.state === 'loading' &&
    navigation.location.pathname !== location.pathname;

  return isPageTransition && fallback
    ? fallback
    : React.createElement(router.Outlet, { context });
}

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
};
