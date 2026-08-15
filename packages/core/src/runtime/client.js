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
const { Form, PrefetchPageLinks, useParams, useSearchParams } = router;

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

/**
 * The URL whose data is on screen right now, and the set of URLs that were
 * answered from the cache and still owe a refresh.
 *
 * `renderedKey` is tracked here rather than read from `window.location`
 * because the two disagree exactly when it matters. On a POP — Back, Forward
 * — the browser updates the address *before* any loader runs, so a loader
 * comparing itself to `window.location` sees a match and concludes it is
 * revalidating the current page, when in fact the user has just navigated
 * somewhere else. That is why Back used to always refetch. `RouteOutlet`
 * publishes the real answer once a navigation has actually committed.
 */
let renderedKey = null;
const servedFromCache = new Set();

function clearClientCache() {
  clientDataCache.clear();
  servedFromCache.clear();
}

/** Told by `RouteOutlet` once a navigation has actually committed. */
function setRenderedKey(key) {
  renderedKey = key;
}

/** Whether this URL was answered from memory and still owes a refresh. */
function consumeServedFromCache(key) {
  return servedFromCache.delete(key);
}

function urlKey(url) {
  const parsed = new URL(url, 'http://ness.local');
  return parsed.pathname + parsed.search;
}

/**
 * Wraps a `clientLoader` so returning to an already-visited URL renders from
 * memory instead of waiting on the network — and is refreshed behind the
 * reader immediately after.
 *
 * The distinction the cache turns on is *navigation* versus *revalidation*.
 * A loader call for a URL other than the one on screen is a navigation, and
 * may be answered from memory. A call for the URL already on screen is a
 * revalidation — react-router re-running loaders after a `<Form>` or a
 * `useFetcher()` action, or after `revalidate()` — and must reach the
 * network, or a refresh would answer with the very thing it was refreshing.
 *
 * A cached answer is provisional, not final: `RouteOutlet` revalidates once
 * as soon as the page it served is mounted, so what the reader sees becomes
 * true within a moment of appearing. That round trip cannot be made from
 * here — react-router only accepts loader data from the call it awaited, so
 * a background refresh started inside a loader could never reach
 * `useLoaderData()`.
 *
 * Prime an entry ahead of time with `prefetchClientLoader` and a first visit
 * is as immediate as a return one.
 */
function cachedClientLoader(loader) {
  return async args => {
    const targetKey = urlKey(args.request.url);
    if (targetKey !== renderedKey && clientDataCache.has(targetKey)) {
      servedFromCache.add(targetKey);
      return clientDataCache.get(targetKey);
    }
    const data = await loader(args);
    clientDataCache.set(targetKey, data);
    servedFromCache.delete(targetKey);
    return data;
  };
}

/**
 * The generated table of every page's URL pattern and the module that serves
 * it, emitted by the router plugin (`virtual:ness/route-prefetch`).
 *
 * Loaded lazily and at most once. An application built without that plugin
 * simply has no table, and prefetching turns itself off rather than becoming
 * something the application has to configure.
 */
let routeTablePromise;

function routeTable() {
  // Not `@vite-ignore`: Vite has to resolve this so the generated table is
  // bundled as a chunk of its own. The router plugin always provides it; the
  // catch below is for a build without that plugin, where prefetching simply
  // does not exist.
  routeTablePromise ??= import('virtual:ness/route-prefetch').then(
    module => module.routes ?? [],
    () => [],
  );
  return routeTablePromise;
}

/**
 * Runs the loader of whichever page answers `href`, ahead of the visit, and
 * files the result under that URL — so the navigation that follows finds its
 * data already in memory and renders in a single frame, with no fallback at
 * all.
 *
 * The route is resolved from the framework's own table rather than from
 * anything the caller passes: the framework already knows which module serves
 * which URL, and an application repeating that in a hand-written map owns a
 * copy that goes stale the first time someone adds a page. Dynamic segments
 * work for the same reason — `matchRoutes` is react-router's own matcher, so
 * `/leads/42` finds the route `/leads/:id` and its loader receives the params
 * it would have received on a real navigation.
 *
 * Cheap to call repeatedly: a URL already cached, already in flight, or
 * already on screen is a no-op, and a failure is swallowed, since the real
 * navigation will simply ask again.
 */
async function prefetchRoute(href) {
  if (typeof window === 'undefined' || !href) return;
  const url = new URL(href, window.location.origin);
  const key = urlKey(url.href);
  if (
    key === renderedKey ||
    clientDataCache.has(key) ||
    prefetchesInFlight.has(key)
  ) {
    return;
  }
  const table = await routeTable();
  if (table.length === 0) return;
  const matches = router.matchRoutes(table, url.pathname);
  const match = matches?.[matches.length - 1];
  if (!match) return;

  prefetchesInFlight.add(key);
  try {
    const module = await match.route.load();
    // Only a client loader can be run ahead of time. A route whose data comes
    // from the server has nothing to warm here — its own request is the work.
    if (typeof module.clientLoader !== 'function') return;
    const data = await module.clientLoader({
      request: new Request(url),
      params: match.params ?? {},
    });
    clientDataCache.set(key, data);
  } catch {
    // A warm-up that fails costs nothing.
  } finally {
    prefetchesInFlight.delete(key);
  }
}

const prefetchesInFlight = new Set();

// Long enough that dragging a pointer across a list of links doesn't fetch
// every page on the way past, short enough to be finished before the click
// that follows a deliberate hover.
const PREFETCH_INTENT_DELAY_MS = 120;

/**
 * The hover/focus handlers behind `<Link prefetch>`.
 *
 * `intent` is the default because it costs nothing until someone shows an
 * intention to click; `render` is for the handful of links worth paying for
 * up front; `none` opts out.
 */
function usePrefetchHandlers(to, prefetch) {
  const timer = React.useRef(undefined);
  const href = typeof to === 'string' ? to : null;
  const active = href !== null && prefetch !== 'none' && prefetch !== false;

  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  React.useEffect(() => {
    if (active && prefetch === 'render') void prefetchRoute(href);
  }, [active, prefetch, href]);

  if (!active || prefetch === 'render') return null;
  const start = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => void prefetchRoute(href),
      PREFETCH_INTENT_DELAY_MS,
    );
  };
  const cancel = () => window.clearTimeout(timer.current);
  return { start, cancel };
}

/** Runs ours and then the caller's, so a link keeps its own handlers. */
function chain(own, given) {
  return event => {
    own(event);
    given?.(event);
  };
}

function withPrefetch(Component, displayName) {
  const Wrapped = React.forwardRef(function NessLink(
    { prefetch = 'intent', onPointerEnter, onFocus, onPointerLeave, onBlur, ...props },
    ref,
  ) {
    const handlers = usePrefetchHandlers(props.to, prefetch);
    return React.createElement(Component, {
      ...props,
      ref,
      onPointerEnter: handlers
        ? chain(handlers.start, onPointerEnter)
        : onPointerEnter,
      onFocus: handlers ? chain(handlers.start, onFocus) : onFocus,
      onPointerLeave: handlers
        ? chain(handlers.cancel, onPointerLeave)
        : onPointerLeave,
      onBlur: handlers ? chain(handlers.cancel, onBlur) : onBlur,
    });
  });
  Wrapped.displayName = displayName;
  return Wrapped;
}

/**
 * React Router's `Link`/`NavLink`, plus `prefetch`.
 *
 * Exported under the same names deliberately: an application should not have
 * to choose between "the link" and "the fast link", and a navigation that
 * feels instant is what a link is supposed to do.
 */
const Link = withPrefetch(router.Link, 'Link');
const NavLink = withPrefetch(router.NavLink, 'NavLink');


/**
 * Drop-in replacement for react-router's `<Outlet/>` in a layout route:
 * shows a fallback during a genuine cross-route pending navigation (a
 * search-param-only change under the same route does not count), and
 * clears the whole `cachedClientLoader` cache once any in-flight mutation
 * — a top-level `<Form>` submission or a `useFetcher()` — finishes. That
 * invalidation is coarse (the entire cache, not just what the mutation
 * actually affected) by design: tracking which cached route depends on
 * which mutation would need every action to declare it, and getting that
 * wrong risks stale data, which is worse than an extra cache miss.
 *
 * `fallback` accepts either a single element (same fallback everywhere) or
 * `(pathname) => ReactNode`, called with `navigation.location.pathname` —
 * the destination being navigated to. This is a plain string match the
 * consumer controls, not automatic per-route resolution: there is no way to
 * read the fallback (or anything else) off the route being navigated TO
 * from react-router 8's stable API while it's still pending and not yet
 * mounted — that would need either `matchRoutes()` against react-router's
 * own live tree (which deliberately omits `HydrateFallback` for a lazy
 * route not yet visited) or an `unstable_`/`UNSAFE_`-prefixed API not safe
 * to depend on. A pathname-keyed function sidesteps that entirely — it
 * never needs to inspect the target route at all, so it stays on fully
 * stable ground while still giving each page its own look. And because
 * this fully replaces `<Outlet/>` while pending, a leaf route's own
 * `HydrateFallback` still only plays a role in the first, full-document
 * hydration — never in client-side navigation, with or without this.
 */
function RouteOutlet({ fallback, context }) {
  const location = router.useLocation();
  const navigation = router.useNavigation();
  const fetchers = router.useFetchers();
  const revalidator = router.useRevalidator();
  const wasSubmittingRef = React.useRef(false);
  const heldTitleRef = React.useRef('');
  const locationKey = location.pathname + location.search;

  React.useEffect(() => {
    const isSubmittingNow =
      navigation.state === 'submitting' ||
      fetchers.some(fetcher => fetcher.state === 'submitting');
    if (wasSubmittingRef.current && !isSubmittingNow) clearClientCache();
    wasSubmittingRef.current = isSubmittingNow;
  }, [navigation.state, fetchers]);

  // Publish what is actually on screen, and settle up for anything that was
  // answered from memory. `cachedClientLoader` cannot do either itself: it
  // has no way to know a navigation committed, and no way to hand a later
  // result to `useLoaderData()`. Revalidating here is a data update, not a
  // navigation, so the page stays mounted and no fallback replaces it.
  React.useEffect(() => {
    setRenderedKey(locationKey);
    if (!consumeServedFromCache(locationKey)) return;
    if (revalidator.state === 'idle') revalidator.revalidate();
  }, [locationKey, revalidator]);

  const isPageTransition =
    navigation.state === 'loading' &&
    navigation.location.pathname !== location.pathname;
  const resolvedFallback = isPageTransition
    ? typeof fallback === 'function'
      ? fallback(navigation.location.pathname)
      : fallback
    : null;
  const showFallback = isPageTransition && Boolean(resolvedFallback);

  // The fallback replaces the page, and a page's `<title>` is part of the
  // page — so without this the tab goes blank (browsers fall back to the
  // URL) for as long as the next page takes to arrive, and a reader watching
  // the tab strip sees the title of the thing they were reading disappear.
  // Holding the outgoing one is what a multi-page browser does natively and
  // what a client-side router has to do deliberately: the title changes when
  // the new page is there to change it.
  //
  // Captured in a layout effect rather than during render because it is read
  // from the document, and re-rendered as a real element so React owns it —
  // assigning `document.title` imperatively would be undone the moment React
  // next reconciles the head.
  React.useLayoutEffect(() => {
    if (!showFallback && typeof document !== 'undefined') {
      heldTitleRef.current = document.title;
    }
  }, [showFallback, locationKey]);

  const body = showFallback
    ? resolvedFallback
    : React.createElement(router.Outlet, { context });

  return showFallback && heldTitleRef.current
    ? React.createElement(
        React.Fragment,
        null,
        React.createElement('title', null, heldTitleRef.current),
        body,
      )
    : body;
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
  prefetchRoute,
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
