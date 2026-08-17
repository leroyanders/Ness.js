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

/**
 * `{scroll: false}` is how Next spells "stay where you are", and applications
 * moving over write it without thinking; react-router spells the same thing
 * `preventScrollReset`. Both are accepted, and an explicit `preventScrollReset`
 * wins if somebody passes both.
 */
function navigateOptions(options) {
  if (!options || !('scroll' in options)) return options;
  const { scroll, ...rest } = options;
  return { preventScrollReset: scroll === false, ...rest };
}

function useRouter() {
  const navigate = router.useNavigate();
  const revalidator = router.useRevalidator();
  return React.useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      prefetch,
      push: (href, options) => navigate(href, navigateOptions(options)),
      refresh: () => revalidator.revalidate(),
      replace: (href, options) =>
        navigate(href, { ...navigateOptions(options), replace: true }),
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

/**
 * Whether this URL's data is already in hand — asked by `RouteOutlet` before
 * it puts a loading state in front of a page it could render right now.
 */
function hasCachedRoute(href) {
  return clientDataCache.has(urlKey(href));
}

/**
 * Whether two URL keys address the same page — same path, arguments aside.
 *
 * `urlKey` carries the query because the *data* differs per query; this
 * question is about the *page*, which does not.
 */
function samePage(a, b) {
  if (!a || !b) return false;
  return a.split('?')[0] === b.split('?')[0];
}

/**
 * The page on screen right now.
 *
 * `renderedKey` is the reliable answer and the reason it exists: on a POP the
 * browser has already changed the address before a single loader runs, so
 * `window.location` would claim the destination is what the reader is looking
 * at. It is only unset before anything has committed — first paint, or a tree
 * that renders neither `RouteOutlet` nor a streamed route — and there the
 * address is as good an answer as there is.
 */
function currentPage() {
  if (renderedKey) return renderedKey;
  return typeof window === 'undefined'
    ? null
    : urlKey(window.location.pathname + (window.location.search || ''));
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
 * What a streamed route's `clientLoader` hands the router while its data is
 * still on the way. A symbol, because every plainer answer — `null`,
 * `undefined`, `{}` — is something a real loader might mean on purpose.
 */
const NESS_PENDING = Symbol('ness.pending');

/**
 * How long the router is given to come back for a result that settled after
 * its navigation had already committed.
 *
 * The hand-off normally happens within a frame of the data landing. This is
 * for when it never happens at all — the reader navigated away mid-flight, or
 * the tab went to the background and its timers were throttled — so that a
 * result nobody claimed is refetched on the next visit rather than served
 * arbitrarily stale.
 */
const STREAM_HANDOFF_TTL_MS = 5000;

/**
 * How long a load is given to finish before the page stops waiting for it and
 * shows the segment's `loading.tsx`.
 *
 * Zero is the literal reading of "commit immediately", and it would put a
 * skeleton on screen for the twenty milliseconds a warm request takes — a
 * flash that reads as a glitch rather than as loading. A window this small is
 * imperceptible as a delay, and comfortably longer than a loader answering
 * from memory: a cached route still navigates in a single frame with no
 * fallback at all, which is the case most worth protecting.
 */
const PENDING_GRACE_MS = 8;

/** Results that settled after their navigation committed, keyed route+URL. */
const streamedResults = new Map();

/** The loads those results will come from, same keys. */
const streamedLoads = new Map();

/**
 * How many settle passes are in flight — the revalidation a streamed route
 * asks for once its data lands, purely so the router will come back and take
 * it.
 *
 * Every route in the chain is polled on that pass, and none of them should
 * act on it: nobody asked for fresh data, one route asked to be re-rendered
 * with data it is already holding. `shouldRevalidate` on a generated route
 * reads this and declines. Routes the framework does not generate — a
 * `loader` in the application's own `root.tsx` — are outside its reach and
 * will refetch, which for the per-URL things a root loader usually computes
 * is the right answer anyway.
 */
let settlePasses = 0;

/** Whether the navigation now loading came from Back or Forward. */
let popNavigation = false;

if (typeof window !== 'undefined') {
  // Back and Forward render from cache, always: those pages were on screen a
  // moment ago and the reader expects them as they left them. Ordinary
  // forward navigation is not cached unless the application asks for it with
  // `cachedClientLoader` — the same bargain Next.js ended up at.
  window.addEventListener('popstate', () => {
    popNavigation = true;
    // The loaders for a POP run in the task the browser dispatched it on.
    setTimeout(() => {
      popNavigation = false;
    }, 0);
  });
}

function streamKey(routeId, url) {
  return `${routeId}\n${urlKey(url)}`;
}

/** Takes a settled result off the shelf, if there is one still worth having. */
function claimStreamedResult(key) {
  const settled = streamedResults.get(key);
  if (!settled) return null;
  streamedResults.delete(key);
  return Date.now() - settled.at > STREAM_HANDOFF_TTL_MS ? null : settled;
}

function beginStreamedLoad(key, load, args) {
  const entry = { streamed: false };
  const settled = Promise.resolve().then(() => load(args));
  entry.settled = settled;
  // Filed the moment it lands, so the settle pass finds it waiting. Attached
  // before anything else races this promise, which is what makes the ordering
  // in `streamedClientLoader` deterministic: this handler runs first, so a
  // load that beats the grace window can delete what it just wrote.
  settled.then(
    value => {
      streamedResults.set(key, { at: Date.now(), ok: true, value });
      // Also kept under the plain URL, which is what Back and Forward read.
      // Those pages were on screen a moment ago; re-fetching them to show
      // the same thing again is a wait the reader did not agree to.
      clientDataCache.set(urlKey(args.request.url), value);
    },
    error => streamedResults.set(key, { at: Date.now(), ok: false, error }),
  );
  streamedLoads.set(key, entry);
  const finish = () => {
    if (streamedLoads.get(key) === entry) streamedLoads.delete(key);
    // Only a load whose navigation already committed has anything to hand
    // over; one that beat the grace window was returned to the router the
    // ordinary way and has nobody waiting on a second pass.
    if (entry.streamed) settlePass();
  };
  settled.then(finish, finish);
  return entry;
}

/**
 * The router's `revalidate`, kept where a settling load can reach it.
 *
 * A load that finishes after its navigation committed has to tell the router
 * to come and collect, and it has no other way to say so: it is a promise in
 * a module, not a component. Every streamed route publishes this while it is
 * on screen, so there is always a current one to call. Which route published
 * it does not matter — they all revalidate the same router.
 */
let requestRevalidate = null;

function publishRevalidate(revalidate) {
  requestRevalidate = revalidate;
}

/**
 * Ask the router to re-run the loaders, so the one holding a settled result
 * can hand it over. Returns whether there was anyone to ask.
 */
function settlePass() {
  if (!requestRevalidate) return false;
  settlePasses += 1;
  requestRevalidate();
  // `shouldRevalidate` is polled synchronously inside `revalidate()`; the
  // flag only has to outlive that call.
  setTimeout(() => {
    settlePasses = Math.max(0, settlePasses - 1);
  }, 0);
  return true;
}

/**
 * The `clientLoader` of a route covered by a `loading.tsx`.
 *
 * It answers in one of two ways. When the data arrives inside the grace
 * window — from `cachedClientLoader`, from a prefetch, from Back — it is
 * returned outright, and the navigation is an ordinary blocking one that
 * happened not to block. Otherwise it returns `NESS_PENDING` immediately,
 * which lets the router commit: the address bar changes, the layouts above
 * stay exactly as they are, and the segment renders its `loading.tsx` while
 * the load carries on. When the load lands the route asks for a revalidation
 * and this hands over what it kept.
 *
 * A revalidation of the page already on screen — after a `<Form>`, after
 * `revalidate()` — is never streamed. There the reader is looking at real
 * content, and replacing it with a skeleton would be a step backwards, so
 * those keep awaiting the loader as they always did.
 */
function streamedClientLoader(routeId, load) {
  return async args => {
    const key = streamKey(routeId, args.request.url);
    const claimed = claimStreamedResult(key);
    if (claimed) {
      if (!claimed.ok) throw claimed.error;
      return claimed.value;
    }

    const target = urlKey(args.request.url);
    // Same page, whatever its arguments say: this is not a navigation the
    // reader made, it is the page changing its own mind — a month in a
    // calendar, a tab, a filter, a sort. They are already looking at real
    // content, and taking it away to show a skeleton of it is a step
    // backwards, so these keep awaiting the loader as they always did. The
    // page shows its own pending state (`useNavigation`) if it wants one.
    //
    // A revalidation of the very same URL — after a `<Form>`, after
    // `revalidate()` — is the same case and covered by the same test.
    if (samePage(target, currentPage())) return load(args);

    if (popNavigation && clientDataCache.has(target)) {
      servedFromCache.add(target);
      return clientDataCache.get(target);
    }

    const entry = streamedLoads.get(key) ?? beginStreamedLoad(key, load, args);
    let raced;
    try {
      raced = await Promise.race([
        entry.settled,
        new Promise(resolve =>
          setTimeout(() => resolve(NESS_PENDING), PENDING_GRACE_MS),
        ),
      ]);
    } catch (error) {
      // Redirects are thrown, and a guard that throws one is the commonest
      // thing a loader does inside the grace window. Whatever it was, it has
      // been handed to the router now and must not be handed over twice.
      streamedResults.delete(key);
      throw error;
    }
    if (raced === NESS_PENDING) {
      // From here the load owns the hand-off: when it lands it will ask the
      // router to come back for it.
      entry.streamed = true;
      return NESS_PENDING;
    }
    // This navigation never showed a fallback, so there is no hand-off to
    // come and nothing should be left on the shelf for the next visit. What
    // Back reads is a different shelf, written by the load itself.
    streamedResults.delete(key);
    return raced;
  };
}

/**
 * A route that renders its segment's `loading.tsx` while its own data is on
 * the way, and the page itself once the data is there.
 *
 * This is the whole of the nesting rule. A boundary belongs to whichever
 * route is waiting, so a layout that is not reloading simply keeps rendering
 * — moving between two pages under the same layout replaces the page area and
 * nothing else, and a navigation that does reload the layout falls back at
 * the level above instead. Nothing has to work out which fallback belongs to
 * which destination, because each route only ever answers for itself.
 */
function streamedComponent(Page, Loading, routeId) {
  return function NessStreamedRoute(props) {
    const data = router.useLoaderData();
    const location = router.useLocation();
    const revalidator = router.useRevalidator();
    const pending = data === NESS_PENDING;
    const path = location.pathname + location.search;

    // Lend the router's `revalidate` to the module, so a load that settles
    // after this navigation committed has a way to ask for its hand-off.
    React.useEffect(() => {
      publishRevalidate(revalidator.revalidate);
    }, [revalidator.revalidate]);

    // The safety net for the one case the load itself cannot cover: it landed
    // before this route was ever rendered, so the ask it made went nowhere.
    React.useEffect(() => {
      if (!pending) return;
      const key = streamKey(routeId, path);
      if (streamedResults.has(key)) settlePass();
    }, [pending, path]);

    // The same bookkeeping `RouteOutlet` does, done here too so it holds in a
    // layout that renders a plain `<Outlet/>`: publish what is really on
    // screen, and settle up for anything answered from cache.
    React.useEffect(() => {
      if (pending) return;
      setRenderedKey(urlKey(path));
      if (
        consumeServedFromCache(urlKey(path)) &&
        revalidator.state === 'idle'
      ) {
        revalidator.revalidate();
      }
    }, [pending, path, revalidator]);

    return pending
      ? React.createElement(Loading)
      : React.createElement(Page, props);
  };
}

/**
 * Wires a route module and the `loading.tsx` covering it into the three
 * exports react-router asks for. Called by generated route modules; an
 * application never writes this itself.
 *
 * A route with no loader has nothing to wait for and is handed back
 * untouched, so `loading.tsx` costs nothing where there is no data.
 */
function streamRoute(route, Loading, options = {}) {
  const { id, serverLoader = false, shouldRevalidate } = options;
  const load =
    typeof route.clientLoader === 'function'
      ? route.clientLoader
      : serverLoader
        ? args => args.serverLoader()
        : null;
  if (!load || typeof Loading !== 'function') {
    return {
      Component: route.default,
      clientLoader: route.clientLoader,
      shouldRevalidate,
    };
  }
  const clientLoader = streamedClientLoader(id, load);
  // A route that asked to run its own loader on hydration still does.
  if (route.clientLoader?.hydrate) clientLoader.hydrate = true;
  return {
    Component: streamedComponent(route.default, Loading, id),
    clientLoader,
    shouldRevalidate(args) {
      // On a settle pass exactly one route has something to collect.
      if (settlePasses > 0)
        return streamedResults.has(streamKey(id, args.nextUrl));
      return typeof shouldRevalidate === 'function'
        ? shouldRevalidate(args)
        : args.defaultShouldRevalidate;
    },
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
 * What `prefetch="auto"` — the default — actually means.
 *
 * In a build, a link warms itself as soon as it is on screen, which is what
 * Next does and what makes a navigation land in one frame instead of three.
 * In development it waits for hover: the pages are being edited, every warm-up
 * is a module graph compiled for a page nobody asked for, and the wait for the
 * one page you did ask for gets longer.
 *
 * Save-Data, and connections slow enough that the browser says so, turn it off
 * entirely — a prefetch is a guess, and a guess is not worth someone's data.
 */
function autoPrefetchMode() {
  if (typeof navigator !== 'undefined') {
    const connection = navigator.connection;
    if (connection?.saveData) return 'none';
    if (/2g/.test(connection?.effectiveType ?? '')) return 'none';
  }
  const production =
    typeof import.meta !== 'undefined' && import.meta.env?.PROD === true;
  return production ? 'viewport' : 'intent';
}

/** Warms a link once it comes into view, then stops watching it. */
function useViewportPrefetch(elementRef, href, active) {
  React.useEffect(() => {
    if (!active || !href || typeof IntersectionObserver === 'undefined')
      return undefined;
    const element = elementRef.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        void prefetchRoute(href);
      },
      // Started slightly before the link is actually visible, so a link
      // scrolled to deliberately is usually warm by the time it is read.
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [active, href, elementRef]);
}

/**
 * The hover/focus handlers behind `<Link prefetch>`.
 *
 * `auto` is the default and resolves per environment (see above); `intent` is
 * hover or keyboard focus; `viewport` is as soon as the link is on screen;
 * `render` is as soon as it exists, for the handful worth paying for up front;
 * `none` opts out.
 */
function usePrefetchHandlers(to, prefetch) {
  const timer = React.useRef(undefined);
  const href = typeof to === 'string' ? to : null;
  const active = href !== null && prefetch !== 'none' && prefetch !== false;

  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  React.useEffect(() => {
    if (active && prefetch === 'render') void prefetchRoute(href);
  }, [active, prefetch, href]);

  if (!active || prefetch === 'render' || prefetch === 'viewport') return null;
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
    {
      prefetch = 'auto',
      scroll,
      onPointerEnter,
      onFocus,
      onPointerLeave,
      onBlur,
      ...props
    },
    ref,
  ) {
    const mode = prefetch === 'auto' ? autoPrefetchMode() : prefetch;
    const handlers = usePrefetchHandlers(props.to, mode);
    const element = React.useRef(null);
    const setRef = React.useCallback(
      node => {
        element.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    useViewportPrefetch(
      element,
      typeof props.to === 'string' ? props.to : null,
      mode === 'viewport',
    );
    return React.createElement(Component, {
      // Next's `scroll={false}`, spelled `preventScrollReset` here. Written
      // first so a link passing react-router's own name still wins.
      ...(scroll === false ? { preventScrollReset: true } : null),
      ...props,
      ref: setRef,
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
  // A page whose data is already in memory must not show a loading state:
  // there is nothing to wait for. Without this the cache bought nothing a
  // reader could see — the loader answered instantly, but the skeleton went
  // up anyway, because react-router passes through `state: 'loading'` on its
  // way to rendering either way, and on a real deployment that window also
  // covers fetching the route's own JavaScript. So the outgoing page simply
  // stays until the cached one replaces it, and the refresh that follows
  // lands as a data update underneath the reader rather than as a wait in
  // front of them.
  const destination = navigation.location
    ? navigation.location.pathname + navigation.location.search
    : null;
  const showFallback =
    isPageTransition &&
    Boolean(resolvedFallback) &&
    !(destination && hasCachedRoute(destination));

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
  hasCachedRoute,
  prefetchRoute,
  reportWebVitals,
  streamRoute,
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
