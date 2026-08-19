import React from 'react';
import type { ReactElement, ReactNode } from 'react';
import * as router from 'react-router';
import type { LinkProps, NavLinkProps, To } from 'react-router';
import { reportWebVitals } from '@nessframework/instrumentation';

export interface NavigationProgress {
  location?: router.Location | undefined;
  pending: boolean;
  state: 'idle' | 'loading' | 'submitting';
}

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

/** The arguments react-router hands a client loader. */
export interface ClientLoaderArgs {
  request: Request;
  params?: Record<string, string | undefined>;
  serverLoader?: () => Promise<unknown>;
  [key: string]: unknown;
}

export type ClientLoader = (args: ClientLoaderArgs) => unknown;

function useNavigationProgress(): NavigationProgress {
  const navigation = router.useNavigation();
  return {
    location: navigation.location,
    pending: navigation.state !== 'idle',
    state: navigation.state,
  };
}

function useOptimisticAction<State, Action>(
  initialValue: State,
  reducer: (state: State, action: Action) => State,
): [State, (action: Action) => void, boolean] {
  const [optimistic, addOptimistic] = React.useOptimistic(
    initialValue,
    reducer,
  );
  const navigation = router.useNavigation();
  return [optimistic, addOptimistic, navigation.state !== 'idle'];
}

/**
 * `useRouter().prefetch(href)`, Next's spelling: warms the page behind a URL
 * ahead of the visit — its compiled module chunk, and its data where that can
 * be had ahead of time. Every route is in the build's compiled manifest now
 * (`routeDiscovery: 'initial'` is the default), so there is no discovery
 * request to make — the old `/__manifest` round trip this used to be only
 * exists under `routeDiscovery: { mode: 'lazy' }`, and under `initial` it
 * answered 404.
 */
function prefetch(
  href: string,
  _options: { signal?: AbortSignal; headers?: HeadersInit } = {},
): Promise<void> {
  return prefetchRoute(href);
}

/**
 * `{scroll: false}` is how Next spells "stay where you are", and applications
 * moving over write it without thinking; react-router spells the same thing
 * `preventScrollReset`. Both are accepted, and an explicit `preventScrollReset`
 * wins if somebody passes both.
 */
function navigateOptions(
  options?: Record<string, unknown> & { scroll?: boolean },
): Record<string, unknown> | undefined {
  if (!options || !('scroll' in options)) return options;
  const { scroll, ...rest } = options;
  return { preventScrollReset: scroll === false, ...rest };
}

function useRouter(): NessRouter {
  const navigate = router.useNavigate();
  const revalidator = router.useRevalidator();
  return React.useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      prefetch,
      push: (
        href: string,
        options?: Record<string, unknown> & { scroll?: boolean },
      ) => navigate(href, navigateOptions(options)),
      refresh: () => {
        void revalidator.revalidate();
      },
      replace: (
        href: string,
        options?: Record<string, unknown> & { scroll?: boolean },
      ) => navigate(href, { ...navigateOptions(options), replace: true }),
    }),
    [navigate, revalidator],
  );
}

function useSelectedLayoutSegments(): string[] {
  return router.useLocation().pathname.split('/').filter(Boolean);
}

function useSelectedLayoutSegment(index = 0): string | null {
  return useSelectedLayoutSegments()[index] || null;
}

function useLinkStatus(href: string): { pending: boolean } {
  const navigation = router.useNavigation();
  return {
    pending:
      navigation.location?.pathname === href && navigation.state !== 'idle',
  };
}

function useReportWebVitals(
  callback: Parameters<typeof reportWebVitals>[0],
): void {
  React.useEffect(() => reportWebVitals(callback), [callback]);
}

const usePathname = (): string => router.useLocation().pathname;
const { Form, PrefetchPageLinks, useParams, useSearchParams } = router;

/**
 * Deliberately just `fetch()` — its value is having the same name/shape as
 * the server-side `apiFetch(request, path, init?)` a project typically
 * defines for its own `loader`s, so a `clientLoader` reads the same way as
 * the `loader` beside it instead of switching between two different-looking
 * APIs. Also the one place a project can later add shared client-side
 * behaviour (error handling, a base URL, etc.) without touching every route.
 */
function apiFetch(path: string | URL, init?: RequestInit): Promise<Response> {
  return fetch(path, init);
}

/**
 * Keyed by URL, shared across every `cachedClientLoader` in the app.
 * Session-lifetime only — a plain module-scope Map, never persisted, reset
 * on a full reload.
 */
const clientDataCache = new Map<string, unknown>();

/**
 * Expiry times for entries that were stored under a page's `clientCache`
 * TTL. An entry present in `clientDataCache` but absent here (a prefetch, a
 * back/forward snapshot) is not served by the TTL path — only by the flows
 * that always served it.
 */
const clientCacheExpiry = new Map<string, number>();

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
let renderedKey: string | null = null;
const servedFromCache = new Set<string>();

function clearClientCache(): void {
  clientDataCache.clear();
  clientCacheExpiry.clear();
  servedFromCache.clear();
}

/** Told by `RouteOutlet` once a navigation has actually committed. */
function setRenderedKey(key: string): void {
  renderedKey = key;
}

/** Whether this URL was answered from memory and still owes a refresh. */
function consumeServedFromCache(key: string): boolean {
  return servedFromCache.delete(key);
}

/**
 * Whether this URL's data is already in hand — asked by `RouteOutlet` before
 * it puts a loading state in front of a page it could render right now.
 *
 * Route-owned entries are keyed `routeId\nurl` so that a layout and its page,
 * which load different data for the same URL, cannot overwrite each other;
 * this question is about the URL, so both spellings are checked.
 */
function hasCachedRoute(href: string): boolean {
  const target = urlKey(href);
  if (clientDataCache.has(target)) return true;
  for (const key of clientDataCache.keys()) {
    const split = key.indexOf('\n');
    if (split !== -1 && key.slice(split + 1) === target) return true;
  }
  return false;
}

/**
 * Whether two URL keys address the same page — same path, arguments aside.
 *
 * `urlKey` carries the query because the *data* differs per query; this
 * question is about the *page*, which does not.
 */
function samePage(a: string | null, b: string | null): boolean {
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
function currentPage(): string | null {
  if (renderedKey) return renderedKey;
  return typeof window === 'undefined'
    ? null
    : urlKey(window.location.pathname + (window.location.search || ''));
}

function urlKey(url: string): string {
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
function cachedClientLoader<T extends (args: never) => Promise<unknown>>(
  loader: T,
): T {
  return (async (args: ClientLoaderArgs) => {
    const targetKey = urlKey(args.request.url);
    // `currentPage()`, not `renderedKey`: the latter is unset until something
    // commits, and never set at all under a layout that renders a plain
    // `<Outlet/>`. Reading it raw made every URL look like a navigation, so a
    // revalidation of the page on screen was answered from the cache — the one
    // thing the split below exists to prevent.
    if (targetKey !== currentPage() && clientDataCache.has(targetKey)) {
      servedFromCache.add(targetKey);
      return clientDataCache.get(targetKey);
    }
    const data = await (loader as unknown as ClientLoader)(args);
    clientDataCache.set(targetKey, data);
    servedFromCache.delete(targetKey);
    return data;
  }) as unknown as T;
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

/**
 * The grace window of a route that owes its fallback a minimum stay
 * (`minimumLoadingMs` in `ness.config`). Once showing the skeleton costs a
 * whole second, the eight-millisecond trigger is the wrong trade: a load that
 * would have finished at eighty milliseconds flashed bones and then made the
 * reader wait out the hold for data that was already there. Waiting a beat
 * longer before committing means loads that fast never show a skeleton at
 * all, and for the loads that genuinely miss it the extra wait is noise
 * against the second they were about to spend anyway.
 */
const HELD_PENDING_GRACE_MS = 100;

/**
 * When each streamed navigation's fallback may be replaced, keyed like
 * `streamedResults`. Written the moment a route answers `NESS_PENDING` with a
 * minimum stay configured; a load that lands sooner has its hand-off deferred
 * to this deadline, so a skeleton that appeared at all stays up long enough
 * to read as a state rather than a flash. Entries leave with the result they
 * covered — claimed, discarded, or superseded.
 */
const streamHoldUntil = new Map<string, number>();

/** A load that settled, waiting for the router to come back and collect it. */
type SettledResult =
  | { at: number; ok: true; value: unknown }
  | { at: number; ok: false; error: unknown };

interface StreamedLoad {
  streamed: boolean;
  settled: Promise<unknown>;
}

/** Results that settled after their navigation committed, keyed route+URL. */
const streamedResults = new Map<string, SettledResult>();

/** The loads those results will come from, same keys. */
const streamedLoads = new Map<string, StreamedLoad>();

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

function streamKey(routeId: string, url: string): string {
  return `${routeId}\n${urlKey(url)}`;
}

/** Takes a settled result off the shelf, if there is one still worth having. */
function claimStreamedResult(key: string): SettledResult | null {
  const settled = streamedResults.get(key);
  if (!settled) return null;
  streamedResults.delete(key);
  streamHoldUntil.delete(key);
  return Date.now() - settled.at > STREAM_HANDOFF_TTL_MS ? null : settled;
}

function beginStreamedLoad(
  key: string,
  load: ClientLoader,
  args: ClientLoaderArgs,
): StreamedLoad {
  const settled = Promise.resolve().then(() => load(args));
  const entry: StreamedLoad = { streamed: false, settled };
  // Filed the moment it lands, so the settle pass finds it waiting. Attached
  // before anything else races this promise, which is what makes the ordering
  // in `streamedClientLoader` deterministic: this handler runs first, so a
  // load that beats the grace window can delete what it just wrote.
  settled.then(
    value => {
      streamedResults.set(key, { at: Date.now(), ok: true, value });
      // Also kept on the route's own shelf, which is what Back and Forward
      // read. Those pages were on screen a moment ago; re-fetching them to
      // show the same thing again is a wait the reader did not agree to.
      // Keyed route+URL, not URL alone: a layout and its page load different
      // data for the same URL, and one must not be served the other's.
      clientDataCache.set(key, value);
    },
    (error: unknown) =>
      streamedResults.set(key, { at: Date.now(), ok: false, error }),
  );
  streamedLoads.set(key, entry);
  const finish = () => {
    if (streamedLoads.get(key) === entry) streamedLoads.delete(key);
    // Only a load whose navigation already committed has anything to hand
    // over; one that beat the grace window was returned to the router the
    // ordinary way and has nobody waiting on a second pass.
    if (!entry.streamed) return;
    // A fallback still owed the rest of its minimum stay keeps it: the
    // result sits on the shelf and the ask is made when the hold is over.
    // The deadline comfortably beats the hand-off TTL, so deferring never
    // turns a fresh result into a discarded one.
    const holdFor = (streamHoldUntil.get(key) ?? 0) - Date.now();
    if (holdFor > 0) setTimeout(settlePass, holdFor);
    else settlePass();
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
let requestRevalidate: (() => void) | null = null;

function publishRevalidate(revalidate: () => void): void {
  requestRevalidate = revalidate;
}

/**
 * Ask the router to re-run the loaders, so the one holding a settled result
 * can hand it over. Returns whether there was anyone to ask.
 */
function settlePass(): boolean {
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
function streamedClientLoader(
  routeId: string,
  load: ClientLoader,
  cacheSecondsOf: () => number = () => 0,
  minimumMs = 0,
): ClientLoader {
  return async (args: ClientLoaderArgs) => {
    const key = streamKey(routeId, args.request.url);
    const target = urlKey(args.request.url);
    const store = (value: unknown): unknown => {
      const cacheSeconds = cacheSecondsOf();
      if (cacheSeconds > 0) {
        clientDataCache.set(key, value);
        clientCacheExpiry.set(key, Date.now() + cacheSeconds * 1000);
      }
      return value;
    };
    const claimed = claimStreamedResult(key);
    if (claimed) {
      if (!claimed.ok) throw claimed.error;
      return store(claimed.value);
    }

    // Same page, whatever its arguments say: this is not a navigation the
    // reader made, it is the page changing its own mind — a month in a
    // calendar, a tab, a filter, a sort. They are already looking at real
    // content, and taking it away to show a skeleton of it is a step
    // backwards, so these keep awaiting the loader as they always did. The
    // page shows its own pending state (`useNavigation`) if it wants one.
    //
    // A revalidation of the very same URL — after a `<Form>`, after
    // `revalidate()` — is the same case and covered by the same test, and
    // its fresh answer re-arms the TTL below.
    if (samePage(target, currentPage())) return store(await load(args));

    // The page's `clientCache` window (its own export, or the application
    // default): within it a navigation is answered from memory outright — no
    // fetch, no revalidation pass. Past it the entry is still what the reader
    // saw a moment ago, so it is served one more time as a stale answer that
    // owes a refresh — the same debt a Back navigation records — and the
    // loader re-runs behind real content as a data update instead of putting
    // a skeleton in front of nothing. The expiry may also have been set by a
    // prefetch, which is the same statement made ahead of time.
    const expiresAt = clientCacheExpiry.get(key);
    if (expiresAt !== undefined && clientDataCache.has(key)) {
      if (expiresAt > Date.now()) return clientDataCache.get(key);
      clientCacheExpiry.delete(key);
      servedFromCache.add(target);
      return clientDataCache.get(key);
    }

    if (popNavigation && clientDataCache.has(key)) {
      servedFromCache.add(target);
      return clientDataCache.get(key);
    }

    const entry = streamedLoads.get(key) ?? beginStreamedLoad(key, load, args);
    let raced: unknown;
    try {
      raced = await Promise.race([
        entry.settled,
        new Promise(resolve =>
          setTimeout(
            () => resolve(NESS_PENDING),
            minimumMs > 0 ? HELD_PENDING_GRACE_MS : PENDING_GRACE_MS,
          ),
        ),
      ]);
    } catch (error) {
      // Redirects are thrown, and a guard that throws one is the commonest
      // thing a loader does inside the grace window. Whatever it was, it has
      // been handed to the router now and must not be handed over twice.
      streamedResults.delete(key);
      streamHoldUntil.delete(key);
      throw error;
    }
    if (raced === NESS_PENDING) {
      // From here the load owns the hand-off: when it lands it will ask the
      // router to come back for it.
      entry.streamed = true;
      // The fallback is about to be on screen; stamp how long it must stay.
      if (minimumMs > 0) streamHoldUntil.set(key, Date.now() + minimumMs);
      return NESS_PENDING;
    }
    // This navigation never showed a fallback, so there is no hand-off to
    // come and nothing should be left on the shelf for the next visit. What
    // Back reads is a different shelf, written by the load itself.
    streamedResults.delete(key);
    streamHoldUntil.delete(key);
    return store(raced);
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
/**
 * Holds the document title steady while a streamed route shows its loading
 * boundary.
 *
 * On a client navigation the previous page unmounts — taking its hoisted
 * `<title>` with it — while the loading boundary renders nothing into the
 * head, so for the length of the fetch the document had no title at all and
 * the tab flashed the bare URL. The old title is captured in a lazy state
 * initializer, which runs during the render in which the previous page is
 * still committed, and re-rendered from here until the real page mounts and
 * its own title takes over.
 */
function HeldTitle(): React.ReactElement | null {
  const [held] = React.useState(() =>
    typeof document === 'undefined' ? '' : document.title,
  );
  if (!held) return null;
  return React.createElement('title', null, held);
}

/**
 * Clears the whole navigation cache once any in-flight mutation — a top-level
 * `<Form>` submission or a `useFetcher()` — finishes.
 *
 * Coarse on purpose: tracking which cached route depends on which mutation
 * would need every action to declare it, and getting that wrong risks stale
 * data, which is worse than an extra cache miss. Lives in every generated
 * route component as well as `RouteOutlet`, so the guarantee holds in a
 * layout that renders a plain `<Outlet/>` too; clearing twice costs nothing.
 */
function useMutationCacheClear(): void {
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
}

function streamedComponent(
  Page: React.ComponentType<Record<string, unknown>>,
  Loading: React.ComponentType,
  routeId: string,
): React.ComponentType<Record<string, unknown>> {
  return function NessStreamedRoute(props: Record<string, unknown>) {
    const data = router.useLoaderData();
    const location = router.useLocation();
    const revalidator = router.useRevalidator();
    const pending = data === NESS_PENDING;
    const path = location.pathname + location.search;

    useMutationCacheClear();

    // Lend the router's `revalidate` to the module, so a load that settles
    // after this navigation committed has a way to ask for its hand-off.
    React.useEffect(() => {
      publishRevalidate(revalidator.revalidate);
    }, [revalidator.revalidate]);

    // The safety net for the one case the load itself cannot cover: it landed
    // before this route was ever rendered, so the ask it made went nowhere.
    // The minimum stay applies here too — the fallback only just mounted, so
    // a result already waiting is exactly the flash the hold exists to stop.
    React.useEffect(() => {
      if (!pending) return;
      const key = streamKey(routeId, path);
      if (!streamedResults.has(key)) return;
      const holdFor = (streamHoldUntil.get(key) ?? 0) - Date.now();
      if (holdFor <= 0) {
        settlePass();
        return;
      }
      const timer = setTimeout(settlePass, holdFor);
      return () => clearTimeout(timer);
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
        void revalidator.revalidate();
      }
    }, [pending, path, revalidator]);

    return pending
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(HeldTitle),
          React.createElement(Loading),
        )
      : React.createElement(Page, props);
  };
}

/** A route module, as much of it as `streamRoute` reaches into. */
export interface RouteModule {
  default?: React.ComponentType<Record<string, unknown>>;
  clientLoader?: ClientLoader & { hydrate?: boolean };
  /**
   * `export const clientCache = 60` on a page: client-side navigations to it
   * are answered from memory for that many seconds instead of refetching the
   * server loader. Past the window the last answer is still served — in a
   * frame, no fallback — while the loader re-runs behind it and lands as a
   * data update, so a repeat visit never waits on the network at all.
   * Mutations still clear the whole cache (`RouteOutlet`), and a document
   * request never sees this — it is purely the navigation layer's memory.
   */
  clientCache?: number;
}

export interface StreamRouteOptions {
  id?: string;
  serverLoader?: boolean;
  shouldRevalidate?: (args: router.ShouldRevalidateFunctionArgs) => boolean;
  /**
   * The application-wide `clientCache` default (`ness.config.ts`), baked into
   * the generated wrapper. A page's own `clientCache` export overrides it —
   * including `clientCache = 0`, which opts the page back out.
   */
  defaultSeconds?: number;
  /**
   * Minimum time a shown `loading.tsx` stays on screen, in milliseconds
   * (`minimumLoadingMs` in `ness.config`, baked into the generated wrapper).
   * A load that finishes sooner keeps the fallback up for the remainder, so
   * a skeleton reads as a state rather than a flash. Navigations answered
   * within the grace window never show the fallback and owe nothing.
   */
  minimumMs?: number;
}

/**
 * How long navigations to this route may be answered from memory: the page's
 * own `clientCache` export when it states one, the application default
 * otherwise. Resolved per call so the page module stays the single source.
 */
function routeCacheSeconds(
  route: RouteModule,
  defaultSeconds: number,
): () => number {
  return () =>
    typeof route.clientCache === 'number'
      ? Math.max(0, route.clientCache)
      : Math.max(0, defaultSeconds);
}

export interface StreamedRoute {
  Component?: React.ComponentType<Record<string, unknown>> | undefined;
  clientLoader?: ClientLoader | undefined;
  shouldRevalidate?:
    ((args: router.ShouldRevalidateFunctionArgs) => boolean) | undefined;
}

/**
 * Wires a route module and the `loading.tsx` covering it into the three
 * exports react-router asks for. Called by generated route modules; an
 * application never writes this itself.
 *
 * A route with no loader has nothing to wait for and is handed back
 * untouched, so `loading.tsx` costs nothing where there is no data.
 */
function streamRoute(
  route: RouteModule,
  Loading: React.ComponentType,
  options: StreamRouteOptions = {},
): StreamedRoute {
  const {
    id,
    serverLoader = false,
    shouldRevalidate,
    defaultSeconds = 0,
    minimumMs = 0,
  } = options;
  const load: ClientLoader | null =
    typeof route.clientLoader === 'function'
      ? route.clientLoader
      : serverLoader
        ? (args: ClientLoaderArgs) => args.serverLoader!()
        : null;
  if (!load || typeof Loading !== 'function') {
    return {
      Component: route.default,
      clientLoader: route.clientLoader,
      shouldRevalidate,
    };
  }
  const clientLoader = streamedClientLoader(
    id!,
    load,
    // The page's own statement about how long a navigation may reuse its
    // data. Read off the module so the generated wrapper needs no new
    // plumbing to carry it.
    routeCacheSeconds(route, defaultSeconds),
    minimumMs,
  ) as ClientLoader & {
    hydrate?: boolean;
  };
  // A route that asked to run its own loader on hydration still does.
  if (route.clientLoader?.hydrate) clientLoader.hydrate = true;
  return {
    Component: streamedComponent(route.default!, Loading, id!),
    clientLoader,
    shouldRevalidate(args: router.ShouldRevalidateFunctionArgs) {
      // On a settle pass exactly one route has something to collect.
      if (settlePasses > 0)
        return streamedResults.has(streamKey(id!, String(args.nextUrl)));
      return typeof shouldRevalidate === 'function'
        ? shouldRevalidate(args)
        : args.defaultShouldRevalidate;
    },
  };
}

/**
 * The `clientLoader` of a route with no `loading.tsx`: `streamedClientLoader`
 * minus the streaming. There is no boundary to show, so a load that has to
 * reach the network simply blocks the navigation the way it always did — what
 * this adds is every way of *not* reaching the network: the `clientCache`
 * window, and Back/Forward rendering the page as it was left.
 */
function cachedRouteClientLoader(
  routeId: string,
  load: ClientLoader,
  cacheSecondsOf: () => number,
): ClientLoader {
  return async (args: ClientLoaderArgs) => {
    const key = streamKey(routeId, args.request.url);
    const target = urlKey(args.request.url);
    const store = (value: unknown): unknown => {
      // Always kept for Back/Forward; the expiry decides whether an ordinary
      // navigation may reuse it too.
      clientDataCache.set(key, value);
      const cacheSeconds = cacheSecondsOf();
      if (cacheSeconds > 0)
        clientCacheExpiry.set(key, Date.now() + cacheSeconds * 1000);
      else clientCacheExpiry.delete(key);
      return value;
    };
    // A revalidation of the page on screen — after a `<Form>`, after
    // `revalidate()`, a search-param change — must reach the network, or a
    // refresh would answer with the very thing it was refreshing.
    if (samePage(target, currentPage())) return store(await load(args));

    // Same window, same past-the-window bargain as the streamed wrapper:
    // stale is served in a frame and a refresh follows behind it.
    const expiresAt = clientCacheExpiry.get(key);
    if (expiresAt !== undefined && clientDataCache.has(key)) {
      if (expiresAt > Date.now()) return clientDataCache.get(key);
      clientCacheExpiry.delete(key);
      servedFromCache.add(target);
      return clientDataCache.get(key);
    }

    if (popNavigation && clientDataCache.has(key)) {
      servedFromCache.add(target);
      return clientDataCache.get(key);
    }

    return store(await load(args));
  };
}

/**
 * The same bookkeeping `streamedComponent` does, for a route that never
 * streams: publish what is really on screen, settle up for a navigation that
 * was answered from memory, and clear the cache once a mutation lands — so
 * all of it holds under a layout that renders a plain `<Outlet/>`.
 */
function cachedComponent(
  Page: React.ComponentType<Record<string, unknown>>,
): React.ComponentType<Record<string, unknown>> {
  return function NessCachedRoute(props: Record<string, unknown>) {
    const location = router.useLocation();
    const revalidator = router.useRevalidator();
    const path = location.pathname + location.search;

    useMutationCacheClear();

    React.useEffect(() => {
      setRenderedKey(urlKey(path));
      if (
        consumeServedFromCache(urlKey(path)) &&
        revalidator.state === 'idle'
      ) {
        void revalidator.revalidate();
      }
    }, [path, revalidator]);

    return React.createElement(Page, props);
  };
}

export interface CacheRouteOptions {
  id?: string;
  serverLoader?: boolean;
  shouldRevalidate?: (args: router.ShouldRevalidateFunctionArgs) => boolean;
  /** The application-wide `clientCache` default; see `StreamRouteOptions`. */
  defaultSeconds?: number;
}

/**
 * Wires a route module with a loader but no `loading.tsx` into exports whose
 * navigations can be answered from memory. Called by generated route modules;
 * an application never writes this itself.
 *
 * This is what makes `clientCache` — the page's own export or the
 * application-wide default — independent of streaming: a page that never
 * shows a skeleton still stops refetching the server loader inside its
 * window, and still renders instantly on Back/Forward.
 */
function cacheRoute(
  route: RouteModule,
  options: CacheRouteOptions = {},
): StreamedRoute {
  const {
    id,
    serverLoader = false,
    shouldRevalidate,
    defaultSeconds = 0,
  } = options;
  const load: ClientLoader | null =
    typeof route.clientLoader === 'function'
      ? route.clientLoader
      : serverLoader
        ? (args: ClientLoaderArgs) => args.serverLoader!()
        : null;
  if (!load) {
    return {
      Component: route.default,
      clientLoader: route.clientLoader,
      shouldRevalidate,
    };
  }
  const clientLoader = cachedRouteClientLoader(
    id!,
    load,
    routeCacheSeconds(route, defaultSeconds),
  ) as ClientLoader & { hydrate?: boolean };
  // A route that asked to run its own loader on hydration still does.
  if (route.clientLoader?.hydrate) clientLoader.hydrate = true;
  return {
    Component: route.default ? cachedComponent(route.default) : route.default,
    clientLoader,
    shouldRevalidate(args: router.ShouldRevalidateFunctionArgs) {
      // A settle pass belongs to whichever streamed route asked for it;
      // nobody else should refetch on its account.
      if (settlePasses > 0) return false;
      return typeof shouldRevalidate === 'function'
        ? shouldRevalidate(args)
        : args.defaultShouldRevalidate;
    },
  };
}

/** One row of the generated prefetch table. */
interface PrefetchRoute {
  path: string;
  id: string;
  /** Whether the page's data comes from a server `loader`. */
  serverLoader?: boolean;
  /** Whether the generated wrapper owns the route's `clientLoader`. */
  wrapped?: boolean;
  load: () => Promise<{
    clientLoader?: (args: {
      request: Request;
      params: Record<string, string | undefined>;
    }) => unknown;
  }>;
}

/** The generated table plus which data extension this build navigates with. */
interface PrefetchTable {
  routes: PrefetchRoute[];
  mode: 'rsc' | 'data';
}

/**
 * The generated table of every page's URL pattern and the module that serves
 * it, emitted by the router plugin (`virtual:ness/route-prefetch`).
 *
 * Loaded lazily and at most once. An application built without that plugin
 * simply has no table, and prefetching turns itself off rather than becoming
 * something the application has to configure.
 */
let routeTablePromise: Promise<PrefetchTable> | undefined;

function routeTable(): Promise<PrefetchTable> {
  // Not `@vite-ignore`: Vite has to resolve this so the generated table is
  // bundled as a chunk of its own. The router plugin always provides it; the
  // catch below is for a build without that plugin, where prefetching simply
  // does not exist.
  routeTablePromise ??= import('virtual:ness/route-prefetch').then(
    module => ({
      routes: module.routes ?? [],
      mode: module.mode === 'data' ? ('data' as const) : ('rsc' as const),
    }),
    () => ({ routes: [], mode: 'rsc' as const }),
  );
  return routeTablePromise;
}

const prefetchesInFlight = new Set<string>();

/** Data URLs already handed to the browser's prefetch cache this session. */
const prefetchedDataUrls = new Set<string>();

/**
 * The exact URL this route's wrapper will fetch on a navigation: React
 * Router's single-fetch spelling of the page (`/page.data`, `/page.rsc`,
 * `/_.data` for a trailing slash), narrowed to the one route with `_routes`.
 */
function routeDataUrl(url: URL, mode: 'rsc' | 'data', routeId: string): string {
  const target = new URL(url.href);
  target.pathname = target.pathname.endsWith('/')
    ? `${target.pathname}_.${mode}`
    : `${target.pathname}.${mode}`;
  target.searchParams.set('_routes', routeId);
  return target.pathname + target.search;
}

/**
 * Asks the browser to fetch a page's data ahead of the visit, the way React
 * Router's own `<Link prefetch>` does: a `<link rel="prefetch" as="fetch">`
 * lands in the browser's prefetch cache, where the navigation's real fetch
 * finds it. Even when that cache declines, the request has warmed the
 * server's page cache, so the navigation's round trip is answered from
 * memory there instead of running the loaders again.
 */
function appendDataPrefetchLink(href: string): void {
  if (prefetchedDataUrls.has(href)) return;
  prefetchedDataUrls.add(href);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'fetch';
  link.href = href;
  document.head.appendChild(link);
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
async function prefetchRoute(href: string): Promise<void> {
  if (typeof window === 'undefined' || !href) return;
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) return;
  const key = urlKey(url.href);
  if (
    key === currentPage() ||
    hasCachedRoute(key) ||
    prefetchesInFlight.has(key)
  ) {
    return;
  }
  const { routes: table, mode } = await routeTable();
  if (table.length === 0) return;
  // The table's rows are patterns plus a loader, which is exactly the shape
  // matchRoutes matches on — it never reaches for the rest of a RouteObject.
  const matches = router.matchRoutes(
    table as unknown as router.RouteObject[],
    url.pathname,
  );
  const match = matches?.[matches.length - 1];
  if (!match) return;

  prefetchesInFlight.add(key);
  try {
    const route = match.route as unknown as PrefetchRoute;
    // Warms the module chunk whatever else happens below.
    const module = await route.load();
    if (route.serverLoader) {
      // The data lives on the server, so nothing here can run it ahead of
      // time — but the browser can be asked to make the wrapper's exact
      // request early. Only a wrapped route fetches per-route; an unwrapped
      // one rides the batched request `<PrefetchPageLinks>` already covers.
      if (route.wrapped)
        appendDataPrefetchLink(routeDataUrl(url, mode, route.id));
      return;
    }
    if (typeof module.clientLoader !== 'function') return;
    const data = await module.clientLoader({
      request: new Request(url),
      params: match.params ?? {},
    });
    // A streamed wrapper answers with its pending marker when the load is
    // still in flight; the load itself files the result when it settles, and
    // a symbol must never be served as page data.
    if (typeof data !== 'symbol' && data !== undefined)
      clientDataCache.set(key, data);
  } catch {
    // A warm-up that fails costs nothing.
  } finally {
    prefetchesInFlight.delete(key);
  }
}

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
function autoPrefetchMode(): PrefetchMode {
  if (typeof navigator !== 'undefined') {
    const connection = (
      navigator as Navigator & { connection?: NetworkInformation }
    ).connection;
    if (connection?.saveData) return 'none';
    if (/2g/.test(connection?.effectiveType ?? '')) return 'none';
  }
  const production =
    typeof import.meta !== 'undefined' && import.meta.env?.PROD === true;
  return production ? 'viewport' : 'intent';
}

/** Warms a link once it comes into view, then stops watching it. */
function useViewportPrefetch(
  elementRef: React.RefObject<HTMLAnchorElement | null>,
  href: string | null,
  active: boolean,
  onWarm: () => void,
): void {
  React.useEffect(() => {
    if (!active || !href || typeof IntersectionObserver === 'undefined')
      return undefined;
    const element = elementRef.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        onWarm();
        void prefetchRoute(href);
      },
      // Started slightly before the link is actually visible, so a link
      // scrolled to deliberately is usually warm by the time it is read.
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [active, href, elementRef, onWarm]);
}

/**
 * The hover/focus handlers behind `<Link prefetch>`.
 *
 * `auto` is the default and resolves per environment (see above); `intent` is
 * hover or keyboard focus; `viewport` is as soon as the link is on screen;
 * `render` is as soon as it exists, for the handful worth paying for up front;
 * `none` opts out.
 */
function usePrefetchHandlers(
  to: unknown,
  prefetch: PrefetchMode | false | undefined,
  onWarm: () => void,
): { start: () => void; cancel: () => void } | null {
  const timer = React.useRef<number | undefined>(undefined);
  const href = typeof to === 'string' ? to : null;
  const active = href !== null && prefetch !== 'none' && prefetch !== false;

  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  React.useEffect(() => {
    if (active && prefetch === 'render') {
      onWarm();
      void prefetchRoute(href);
    }
  }, [active, prefetch, href, onWarm]);

  if (!active || prefetch === 'render' || prefetch === 'viewport') return null;
  const start = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      onWarm();
      void prefetchRoute(href);
    }, PREFETCH_INTENT_DELAY_MS);
  };
  const cancel = () => window.clearTimeout(timer.current);
  return { start, cancel };
}

/** Runs ours and then the caller's, so a link keeps its own handlers. */
function chain<E>(
  own: (event: E) => void,
  given: ((event: E) => void) | undefined,
): (event: E) => void {
  return event => {
    own(event);
    given?.(event);
  };
}

// ---------------------------------------------------------------------------
// Intercepting routes
// ---------------------------------------------------------------------------

interface InterceptorRoute {
  /** The URL scope the navigation must start from. */
  from: string;
  /** The URL pattern being intercepted, `:params` included. */
  pattern: string;
  load: () => Promise<{
    default: React.ComponentType<{
      params: Record<string, string | undefined>;
    }>;
  }>;
}

/**
 * The generated table of intercepting routes (`virtual:ness/interceptors`).
 * Loaded once and mirrored into a synchronous variable, because the decision
 * has to be made inside a click handler, where nothing can be awaited before
 * `preventDefault`.
 */
let interceptorsSync: InterceptorRoute[] | null = null;
let interceptorTablePromise: Promise<InterceptorRoute[]> | undefined;

function interceptorTable(): Promise<InterceptorRoute[]> {
  interceptorTablePromise ??= import('virtual:ness/interceptors').then(
    module => {
      interceptorsSync = module.interceptors ?? [];
      return interceptorsSync;
    },
    () => {
      interceptorsSync = [];
      return interceptorsSync;
    },
  );
  return interceptorTablePromise;
}

function patternParams(
  pattern: string,
  pathname: string,
): Record<string, string | undefined> | null {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return null;
  const params: Record<string, string | undefined> = {};
  for (let index = 0; index < patternSegments.length; index += 1) {
    const expected = patternSegments[index]!;
    const actual = pathSegments[index]!;
    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected === '*') {
      params['splat'] = pathSegments.slice(index).join('/');
      return params;
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

/** The overlay an intercepted navigation renders into, one at a time. */
let interceptorOverlay: {
  container: HTMLElement;
  unmount: () => void;
} | null = null;

function closeInterceptedRoute(): void {
  if (!interceptorOverlay) return;
  const { container, unmount } = interceptorOverlay;
  interceptorOverlay = null;
  unmount();
  container.remove();
  window.removeEventListener('popstate', closeInterceptedRoute);
}

async function openInterceptor(
  entry: InterceptorRoute,
  url: URL,
): Promise<void> {
  const [module, { createRoot }] = await Promise.all([
    entry.load(),
    import('react-dom/client'),
  ]);
  const params = patternParams(entry.pattern, url.pathname) ?? {};
  closeInterceptedRoute();
  // The URL changes so the address bar, sharing and reload all mean the
  // intercepted page — but the router never hears about it, which is exactly
  // what keeps the current screen mounted underneath.
  window.history.pushState({ __nessInterceptor: true }, '', url.href);
  const container = document.createElement('div');
  container.setAttribute('data-ness-interceptor', '');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(React.createElement(module.default, { params }));
  interceptorOverlay = { container, unmount: () => root.unmount() };
  // Back closes the overlay and lands where the visitor already was.
  window.addEventListener('popstate', closeInterceptedRoute);
}

/**
 * Whether this click should render an interceptor instead of navigating.
 *
 * Yes only when the interceptor's own scope contains the *current* URL — an
 * interception is a statement about where you are coming from, which is the
 * entire difference between it and a plain route. A hard load of the same
 * URL never runs this code and gets the real page.
 */
function maybeIntercept(
  event: {
    defaultPrevented: boolean;
    button?: number;
    metaKey?: boolean;
    altKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    preventDefault: () => void;
  },
  to: unknown,
): void {
  if (typeof window === 'undefined' || typeof to !== 'string') return;
  if (event.defaultPrevented) return;
  if (event.button !== undefined && event.button !== 0) return;
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
  const table = interceptorsSync;
  if (!table || table.length === 0) return;
  const url = new URL(to, window.location.origin);
  if (url.origin !== window.location.origin) return;
  const current = window.location.pathname;
  const entry = table.find(candidate => {
    const scope = candidate.from.replace(/\/+$/, '') || '/';
    const inScope =
      scope === '/' || current === scope || current.startsWith(`${scope}/`);
    return inScope && patternParams(candidate.pattern, url.pathname) !== null;
  });
  if (!entry) return;
  event.preventDefault();
  void openInterceptor(entry, url);
}

/**
 * Only what this wrapper reads. No index signature: with one, destructuring a
 * named property resolves through it and every handler comes out `unknown`.
 * The rest of a link's props travel through the spread untyped, and the public
 * signature returned at the end is what callers actually see.
 */
interface LinkLikeProps {
  to?: To;
  prefetch?: PrefetchMode;
  scroll?: boolean;
  onClick?: (event: unknown) => void;
  onPointerEnter?: (event: unknown) => void;
  onFocus?: (event: unknown) => void;
  onPointerLeave?: (event: unknown) => void;
  onBlur?: (event: unknown) => void;
}

function withPrefetch<Props extends { to: To }>(
  Component: React.ComponentType<Props>,
  displayName: string,
): React.ForwardRefExoticComponent<
  Props & NessLinkProps & React.RefAttributes<HTMLAnchorElement>
> {
  const Wrapped = React.forwardRef<HTMLAnchorElement, LinkLikeProps>(
    function NessLink(
      {
        prefetch = 'auto',
        scroll,
        onClick,
        onPointerEnter,
        onFocus,
        onPointerLeave,
        onBlur,
        ...props
      },
      ref,
    ) {
      const mode = prefetch === 'auto' ? autoPrefetchMode() : prefetch;
      // Once any trigger fires, the link also renders react-router's own
      // `<PrefetchPageLinks>`, which asks the browser to fetch the target
      // page's loader data (`.data`/`.rsc`) and its module chunks ahead of
      // the click — so the navigation that follows finds both already local.
      const [warmed, setWarmed] = React.useState(false);
      const markWarm = React.useCallback(() => setWarmed(true), []);
      const handlers = usePrefetchHandlers(props.to, mode, markWarm);
      // Warm the interceptor table so the click handler can decide
      // synchronously; a build without interceptors resolves to an empty
      // table once and this is free from then on.
      React.useEffect(() => {
        void interceptorTable();
      }, []);
      const element = React.useRef<HTMLAnchorElement | null>(null);
      const setRef = React.useCallback(
        (node: HTMLAnchorElement | null) => {
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
        markWarm,
      );
      // The same value react-router's own Link hands PrefetchPageLinks: the
      // resolved href, basename included.
      const resolvedHref = router.useHref(props.to ?? '');
      const prefetchAbsolute =
        typeof props.to === 'string' &&
        /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(props.to);
      const anchor = React.createElement(Component, {
        // Next's `scroll={false}`, spelled `preventScrollReset` here. Written
        // first so a link passing react-router's own name still wins.
        ...(scroll === false ? { preventScrollReset: true } : null),
        ...props,
        ref: setRef,
        onClick: chain(
          (event: unknown) =>
            maybeIntercept(
              event as Parameters<typeof maybeIntercept>[0],
              props.to,
            ),
          onClick,
        ),
        onPointerEnter: handlers
          ? chain(handlers.start, onPointerEnter)
          : onPointerEnter,
        onFocus: handlers ? chain(handlers.start, onFocus) : onFocus,
        onPointerLeave: handlers
          ? chain(handlers.cancel, onPointerLeave)
          : onPointerLeave,
        onBlur: handlers ? chain(handlers.cancel, onBlur) : onBlur,
      } as unknown as Props);
      if (!warmed || prefetchAbsolute || typeof props.to !== 'string')
        return anchor;
      return React.createElement(
        React.Fragment,
        null,
        anchor,
        React.createElement(router.PrefetchPageLinks, { page: resolvedHref }),
      );
    },
  );
  Wrapped.displayName = displayName;
  return Wrapped as unknown as React.ForwardRefExoticComponent<
    Props & NessLinkProps & React.RefAttributes<HTMLAnchorElement>
  >;
}

/**
 * React Router's `Link`/`NavLink`, plus `prefetch`.
 *
 * Exported under the same names deliberately: an application should not have
 * to choose between "the link" and "the fast link", and a navigation that
 * feels instant is what a link is supposed to do.
 */
const Link = withPrefetch<LinkProps>(
  router.Link as React.ComponentType<LinkProps>,
  'Link',
);
const NavLink = withPrefetch<NavLinkProps>(
  router.NavLink as React.ComponentType<NavLinkProps>,
  'NavLink',
);

export interface RouteOutletProps {
  fallback?: ReactNode | ((pathname: string) => ReactNode);
  context?: unknown;
}

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
function RouteOutlet({ fallback, context }: RouteOutletProps): ReactElement {
  const location = router.useLocation();
  const navigation = router.useNavigation();
  const revalidator = router.useRevalidator();
  const heldTitleRef = React.useRef('');
  const locationKey = location.pathname + location.search;

  useMutationCacheClear();

  // Publish what is actually on screen, and settle up for anything that was
  // answered from memory. `cachedClientLoader` cannot do either itself: it
  // has no way to know a navigation committed, and no way to hand a later
  // result to `useLoaderData()`. Revalidating here is a data update, not a
  // navigation, so the page stays mounted and no fallback replaces it.
  React.useEffect(() => {
    setRenderedKey(locationKey);
    if (!consumeServedFromCache(locationKey)) return;
    if (revalidator.state === 'idle') void revalidator.revalidate();
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

  return (
    showFallback && heldTitleRef.current
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement('title', null, heldTitleRef.current),
          body,
        )
      : body
  ) as ReactElement;
}

/** One matcher entry: a path pattern, or Next's `{source}` object form. */
export type MiddlewareMatcherEntry = string | { source: string };

export interface MiddlewareConfig {
  matcher?: MiddlewareMatcherEntry | MiddlewareMatcherEntry[];
}

/**
 * Compiles one matcher pattern the way Next reads them: `:name` matches a
 * segment, `:name*` the rest of the path, `*` likewise — and a pattern
 * containing a parenthesis is taken as the regular expression it already is,
 * which is how the `'/((?!api|assets).*)'` idiom arrives from Next projects.
 */
function compileMatcher(pattern: string): RegExp {
  if (pattern.includes('(')) return new RegExp(`^${pattern}$`);
  let source = '';
  for (const segment of pattern.split('/')) {
    if (!segment) continue;
    // `:path*` matches zero or more segments — `/about/:path*` covers
    // `/about` itself, which is what the pattern means in Next.
    if (segment === '*' || /^:[A-Za-z0-9_]+\*$/.test(segment)) {
      source += '(?:/.*)?';
    } else if (/^:[A-Za-z0-9_]+$/.test(segment)) {
      source += '/[^/]+';
    } else {
      source += `/${segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
    }
  }
  return new RegExp(`^${source || '/'}/?$`);
}

/**
 * Applies a middleware file's `export const config = { matcher }` — the
 * declarative scope Next middleware ships with. Middleware wrapped here runs
 * only for requests whose pathname matches an entry; everything else passes
 * straight to `next()`. Shape-agnostic on purpose: route-level middleware
 * receives `({request}, next)` and the root file's receives the request
 * context, and both carry the request as the first argument's `request`.
 */
function matchedMiddleware<
  Fn extends (args: { request: Request }, next: () => unknown) => unknown,
>(middleware: Fn | Fn[], config?: MiddlewareConfig): Fn[] {
  const list = Array.isArray(middleware) ? middleware : [middleware];
  const matcher = config?.matcher;
  if (matcher === undefined) return list;
  const patterns = (Array.isArray(matcher) ? matcher : [matcher]).map(entry =>
    compileMatcher(typeof entry === 'string' ? entry : entry.source),
  );
  return list.map(
    fn =>
      ((args: { request: Request }, next: () => unknown) => {
        const pathname = new URL(args.request.url).pathname;
        return patterns.some(pattern => pattern.test(pathname))
          ? fn(args, next)
          : next();
      }) as Fn,
  );
}

export {
  Form,
  Link,
  NavLink,
  PrefetchPageLinks,
  RouteOutlet,
  apiFetch,
  cacheRoute,
  matchedMiddleware,
  cachedClientLoader,
  clearClientCache,
  closeInterceptedRoute,
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
