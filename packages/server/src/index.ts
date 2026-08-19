import { randomUUID } from 'node:crypto';
import {
  createRequestHandler as createRouterRequestHandler,
  RouterContextProvider,
} from 'react-router';
import type { ServerBuild } from 'react-router';
import { getCache, normalizeLife } from '@nessframework/cache';
import type { CacheLife, CacheProfile } from '@nessframework/cache';
import * as instrumentation from '@nessframework/instrumentation';
import {
  createRequestStore,
  flushRequestStore,
  requestStore as requestStoreRef,
  runWithRequestStore,
} from './context.js';
import type { RequestStore } from './context.js';
import { installFetchCache } from './fetch-cache.js';

export * from './responses.js';
export * from './draft.js';
export {
  after,
  assertUntainted,
  connection,
  isDynamicRequest,
  noStore,
  requestStore,
  taintObjectReference,
  taintUniqueValue,
  unstable_noStore,
  waitUntil,
} from './context.js';
export type { RequestStore } from './context.js';
export { installFetchCache, nessFetch } from './fetch-cache.js';
export type { FetchCacheInit } from './fetch-cache.js';

export interface RoutingRule {
  source: string | RegExp;
  destination: string;
  status?: number;
  permanent?: boolean;
}

/**
 * One zone of a multi-zone deployment: everything under `basePath` is served
 * by the application at `destination`, which itself serves its pages under
 * the same base path. The composing app proxies — the visitor sees one
 * domain, and each zone deploys on its own.
 */
export interface Zone {
  basePath: string;
  destination: string;
}

export interface HeaderRule {
  source: string | RegExp;
  headers: Array<{ key: string; value: string }>;
}

export interface NessRequestContext {
  request: Request;
  id: string;
  params: Record<string, string>;
  state: Map<unknown, unknown>;
}

export type Middleware = (
  context: NessRequestContext,
  next: () => Promise<Response>,
) => Promise<Response> | Response;

/** What a page declares about itself, read from the manifest. */
export interface SegmentConfig {
  revalidate?: number | false;
  dynamic?: 'force-dynamic' | 'force-static' | 'auto';
  /** Where the deployment adapter should run this page. */
  runtime?: 'node' | 'edge' | 'serverless';
  /** Seconds the render may take before the request is failed with a 504. */
  maxDuration?: number;
  /**
   * `false` refuses params that were not prerendered: a dynamic segment
   * whose value is not in the prerendered list answers 404 instead of
   * rendering.
   */
  dynamicParams?: boolean;
  /** The default for `fetch()` calls made while rendering this segment. */
  fetchCache?: 'default-cache' | 'default-no-store';
  /** Recorded for deployment adapters that place functions by region. */
  preferredRegion?: string | string[];
  /** Partial prerendering: serve a cached shell, stream the rest. */
  ppr?: boolean;
}

/** One entry of the flat page list in `ness-manifest.json`. */
export interface ManifestPage {
  id?: string;
  path?: string;
  file?: string;
  config?: SegmentConfig;
}

/** What to keep, and for how long. */
export interface PageCachePolicy {
  life?: CacheProfile | CacheLife;
  path?: string;
  tags?: string[];
}

export interface RequestHandlerOptions {
  build?: ServerBuildLike;
  requestHandler?: (
    request: Request,
    context?: unknown,
  ) => Promise<Response> | Response;
  mode?: string | undefined;
  getLoadContext?: (
    request: Request,
    context: NessRequestContext,
  ) =>
    | RouterContextProvider
    | undefined
    | Promise<RouterContextProvider | undefined>;
  middleware?: Middleware[];
  redirects?: RoutingRule[];
  rewrites?: RoutingRule[];
  headers?: HeaderRule[];
  /** Multi-zone composition: path prefixes served by other deployments. */
  zones?: Zone[];
  imageHandler?: (request: Request) => Promise<Response> | Response;
  imagePath?: string;
  /** What to keep. Returning a falsy value leaves the response unstored. */
  cachePolicy?: (
    request: Request,
    response: Response,
  ) => PageCachePolicy | undefined | Promise<PageCachePolicy | undefined>;
  /**
   * Whether the page cache is touched at all for this request.
   *
   * Consulted before the read, so a request this refuses is neither answered
   * from the cache nor stored in it. Override it alongside `cachePolicy`, not
   * instead of it.
   */
  cacheableRequest?: (request: Request) => boolean | Promise<boolean>;
  /**
   * The flat page list from `ness-manifest.json`, carrying each page's own
   * `revalidate`/`dynamic`.
   */
  pages?: ManifestPage[];
  /**
   * Concrete paths the build prerendered, for `dynamicParams: false`: a
   * dynamic segment that refuses unknown params answers 404 for any path not
   * in this list.
   */
  prerenderedPaths?: string[];
}

/** What a platform adapter may hand over alongside one request. */
export interface HandleRequestInit {
  /** The platform's own `waitUntil` (Workers, Lambda streaming). */
  waitUntil?: ((promise: Promise<unknown>) => void) | undefined;
  /**
   * A per-call load context — Workers bindings, Lambda event — used when the
   * handler was not configured with its own `getLoadContext`.
   */
  loadContext?: unknown;
}

/** A React Router server build, described only where this module reaches in. */
export interface ServerBuildLike {
  entry?: {
    module?: Record<string, unknown> & {
      handleError?: (error: unknown, details: HandleErrorDetails) => unknown;
    };
  };
  default?: { fetch?: (request: Request) => Promise<Response> | Response };
  [key: string]: unknown;
}

interface HandleErrorDetails {
  request?: Request;
  params?: Record<string, string>;
}

/** `compilePattern` records the parameter names it found on the expression. */
interface PatternRegExp extends RegExp {
  names?: string[];
}

/** A response flattened into something the shared cache can store. */
export interface SerializedResponse {
  body: ArrayBuffer;
  headers: Array<[string, string]>;
  status: number;
  statusText: string;
}

function compilePattern(pattern: string | RegExp): PatternRegExp {
  if (pattern instanceof RegExp) return pattern;
  const names: string[] = [];
  const source = String(pattern || '/')
    .split('/')
    .map(segment => {
      if (!segment) return '';
      if (segment === '*') {
        names.push('splat');
        return '(.*)';
      }
      const match = segment.match(/^:([A-Za-z0-9_]+)(\*)?$/);
      if (match) {
        names.push(match[1]!);
        return match[2] ? '(.*)' : '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const expression: PatternRegExp = new RegExp(`^${source}/?$`);
  expression.names = names;
  return expression;
}

function matchPattern(
  pattern: string | RegExp,
  pathname: string,
): Record<string, string> | undefined {
  const expression = compilePattern(pattern);
  const match = expression.exec(pathname);
  if (!match) return undefined;
  return Object.fromEntries(
    (expression.names || []).map((name, index) => [
      name,
      decodeURIComponent(match[index + 1] || ''),
    ]),
  );
}

function interpolate(
  destination: string,
  params: Record<string, string>,
): string {
  return destination.replace(
    /:([A-Za-z0-9_]+)\*?/g,
    (_value, name: string) => params[name] || '',
  );
}

/** Either the request to carry on with, or the response that ends it here. */
export type RoutingResult =
  | { request: Request; response?: undefined }
  | { request?: undefined; response: Response };

function applyRoutingRules(
  request: Request,
  {
    redirects = [],
    rewrites = [],
  }: { redirects?: RoutingRule[]; rewrites?: RoutingRule[] } = {},
): RoutingResult {
  const url = new URL(request.url);
  for (const rule of redirects) {
    const params = matchPattern(rule.source, url.pathname);
    if (!params) continue;
    const destination = new URL(interpolate(rule.destination, params), url);
    return {
      response: Response.redirect(
        destination,
        // A rule's status comes from configuration; Response.redirect types it
        // as the five literals it accepts and rejects anything else at runtime.
        (rule.status || (rule.permanent ? 308 : 307)) as Parameters<
          typeof Response.redirect
        >[1],
      ),
    };
  }
  for (const rule of rewrites) {
    const params = matchPattern(rule.source, url.pathname);
    if (!params) continue;
    const destination = new URL(interpolate(rule.destination, params), url);
    return { request: new Request(destination, request) };
  }
  return { request };
}

/** The zone owning this pathname, if any. Longest base path wins. */
function matchZone(zones: Zone[], pathname: string): Zone | undefined {
  let best: Zone | undefined;
  for (const zone of zones) {
    const base = zone.basePath.replace(/\/+$/, '');
    if (pathname !== base && !pathname.startsWith(`${base}/`)) continue;
    if (!best || base.length > best.basePath.replace(/\/+$/, '').length)
      best = zone;
  }
  return best;
}

/**
 * Hands a request to another origin and returns whatever comes back, body
 * streaming through. Used for zones and for rewrites whose destination is
 * absolute: the URL names another deployment, so the answer is theirs.
 */
async function proxyRequest(request: Request): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.set('x-forwarded-host', headers.get('host') || '');
  headers.delete('host');
  const response = await fetch(
    new Request(request.url, {
      method: request.method,
      headers,
      body: request.body,
      // The visitor's client follows redirects against *this* origin; the
      // zone's redirects must come back as redirects, not be swallowed here.
      redirect: 'manual',
      ...(request.body ? { duplex: 'half' } : {}),
    } as RequestInit),
  );
  return response;
}

function applyHeaders(
  response: Response,
  request: Request,
  rules: HeaderRule[] = [],
): Response {
  const headers = new Headers(response.headers);
  const pathname = new URL(request.url).pathname;
  for (const rule of rules) {
    if (!matchPattern(rule.source, pathname)) continue;
    for (const header of rule.headers || [])
      headers.set(header.key, header.value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function composeMiddleware(
  middleware: Middleware[],
  finalHandler: Middleware,
): (context: NessRequestContext) => Promise<Response> {
  return function execute(initialContext: NessRequestContext) {
    let current = -1;
    const dispatch = (index: number): Promise<Response> => {
      if (index <= current)
        return Promise.reject(new Error('next() called more than once.'));
      current = index;
      const handler =
        index === middleware.length ? finalHandler : middleware[index];
      if (!handler)
        return Promise.resolve(new Response('Not Found', { status: 404 }));
      return Promise.resolve(
        handler(initialContext, () => dispatch(index + 1)),
      );
    };
    return dispatch(0);
  };
}

async function serializeResponse(
  response: Response,
): Promise<SerializedResponse> {
  return {
    body: await response.arrayBuffer(),
    headers: [...response.headers] as Array<[string, string]>,
    status: response.status,
    statusText: response.statusText,
  };
}

function restoreResponse(
  serialized: SerializedResponse,
  state: string,
): Response {
  const headers = new Headers(serialized.headers);
  headers.set('x-ness-cache', state);
  return new Response(serialized.body.slice(0), {
    status: serialized.status,
    statusText: serialized.statusText,
    headers,
  });
}

/**
 * Whether a request may be answered from the shared page cache at all.
 *
 * Consulted before the cache is read, not only before it is written. Deciding
 * this on the way out alone leaves whatever is already stored reachable by
 * anyone: a credentialed request would still be served another visitor's
 * rendering, and would never get as far as the policy that was meant to stop
 * it.
 */
function defaultCacheableRequest(request: Request): boolean {
  if (request.method !== 'GET') return false;
  return (
    !request.headers.has('authorization') && !request.headers.has('cookie')
  );
}

/**
 * A response carrying `set-cookie` belongs to the visitor it was rendered for.
 *
 * The page cache is shared and replays stored headers verbatim, so storing one
 * hands the same cookie to every subsequent visitor — an anonymous session id,
 * a CSRF token or an experiment bucket minted on a plain GET is enough. The
 * request-side check cannot catch this: the first visitor arrives without a
 * cookie and is issued one by the render.
 */
function storableResponse(response: Response): boolean {
  return !response.headers.has('set-cookie');
}

/**
 * Whether this URL is React Router's data request for a page — the
 * `<path>.data` (classic) or `<path>.rsc` (RSC mode) fetch a client-side
 * navigation makes instead of asking for the document.
 */
function isDataRequest(pathname: string): boolean {
  return /\.(?:data|rsc)$/.test(pathname);
}

/**
 * The page a data request is asking about: `/dashboard.data` → `/dashboard`,
 * and the trailing-slash spelling `/_.data` → `/`. A pathname that is not a
 * data request comes back unchanged, so this is safe to apply to every
 * request before matching it against the page manifest.
 */
function pagePathname(pathname: string): string {
  if (!isDataRequest(pathname)) return pathname;
  const stripped = pathname.replace(/\.(?:data|rsc)$/, '');
  // React Router spells "the index under a trailing slash" as `_`.
  if (stripped === '_' || stripped === '/_') return '/';
  if (stripped.endsWith('/_')) return stripped.slice(0, -1);
  return stripped;
}

/**
 * Whether a page's data request may be stored, mirroring what the document
 * policy would have decided for the same page.
 *
 * Deliberately narrower than the document default: only a page that declared
 * its own caching window (`revalidate`, `dynamic: 'force-static'`) has its
 * navigations answered from the cache. A page that declared nothing keeps
 * running its loaders per navigation — ISR staleness is a bargain a page opts
 * into, not one it wakes up inside of.
 */
function dataRequestPolicy(
  request: Request,
  response: Response,
  segment: SegmentCachePolicy | undefined,
  pagePath: string,
): PageCachePolicy | undefined {
  if (!segment?.cacheable) return undefined;
  if (!isDataRequest(new URL(request.url).pathname)) return undefined;
  if (request.method !== 'GET') return undefined;
  if (response.status !== 200) return undefined;
  if (!storableResponse(response)) return undefined;
  return { life: 'default', path: pagePath, tags: ['pages'] };
}

function defaultCachePolicy(
  request: Request,
  response: Response,
): PageCachePolicy | undefined {
  if (!defaultCacheableRequest(request)) return undefined;
  if (response.status !== 200) return undefined;
  if (!storableResponse(response)) return undefined;
  if (!(response.headers.get('content-type') || '').includes('text/html'))
    return undefined;
  return {
    life: 'default',
    path: new URL(request.url).pathname,
    tags: ['pages'],
  };
}

/**
 * How specific a pattern is, segment by segment: a literal outranks a
 * parameter, a parameter outranks a splat, and a longer pattern outranks a
 * shorter one that also matched.
 *
 * The same ordering the router itself resolves by, which is the only one that
 * can be right here — a page's caching rules have to be the rules of the page
 * that will actually render, so `/blog/feed` must win over `/blog/:slug`.
 */
function specificity(pattern: string): number {
  const segments = String(pattern).split('/').filter(Boolean);
  let score = segments.length;
  for (const segment of segments) {
    if (segment === '*') score += 0;
    else if (segment.startsWith(':')) score += 10;
    else score += 100;
  }
  return score;
}

/**
 * The page whose pattern answers this pathname, from the flat list the build
 * wrote into `ness-manifest.json`.
 */
function matchPage(
  pages: ManifestPage[],
  pathname: string,
): ManifestPage | undefined {
  let best: ManifestPage | undefined;
  let bestScore = -1;
  for (const page of pages) {
    if (!page?.path) continue;
    if (!matchPattern(page.path, pathname)) continue;
    const score = specificity(page.path);
    if (score > bestScore) {
      best = page;
      bestScore = score;
    }
  }
  return best;
}

/** Whether the shared cache applies to this page, and with what window. */
export interface SegmentCachePolicy {
  cacheable: boolean;
  life?: Required<CacheLife>;
}

/**
 * A page's own `export const revalidate` / `export const dynamic`, turned into
 * the two answers this module needs: may the shared cache be touched at all,
 * and for how long is what it stores good for.
 *
 * `dynamic: 'force-dynamic'` and `revalidate = 0` are the same statement —
 * this page is rendered per request — and both take the request out of the
 * cache before it is read, not only before it is written.
 */
function segmentCachePolicy(
  config: SegmentConfig | undefined,
): SegmentCachePolicy | undefined {
  if (!config) return undefined;
  if (config.dynamic === 'force-dynamic' || config.revalidate === 0)
    return { cacheable: false };
  if (config.revalidate === false)
    return {
      cacheable: true,
      life: { stale: Infinity, revalidate: Infinity, expire: Infinity },
    };
  if (typeof config.revalidate === 'number')
    return {
      cacheable: true,
      // Past `revalidate` the entry is served while it refreshes behind the
      // reader; `expire` is when it stops being worth serving at all.
      life: {
        stale: config.revalidate,
        revalidate: config.revalidate,
        expire: Math.max(config.revalidate * 10, config.revalidate),
      },
    };
  if (config.dynamic === 'force-static') return { cacheable: true };
  return undefined;
}

/**
 * Routes a boundary-caught error to the instrumentation hooks.
 *
 * A loader or an action that throws on a route with an `ErrorBoundary` never
 * reaches this package's own try/catch: React Router catches it, renders the
 * boundary, and returns an ordinary response. The user sees the fallback and
 * the error tracker sees nothing — the failure that matters most is the one
 * that looks handled.
 *
 * React Router reads `entry.module.handleError` once, when it builds its
 * request handler, so the hook is attached by deriving a build rather than by
 * shipping a replacement `entry.server`. Owning that file would mean owning a
 * copy of the streaming render, and watching it drift.
 */
function reportingBuild(
  build: ServerBuildLike | undefined,
): ServerBuildLike | undefined {
  const entryModule = build?.entry?.module;
  if (!entryModule) return build;

  const applicationHandler = entryModule.handleError;

  return {
    ...build,
    entry: {
      ...build!.entry,
      module: {
        ...entryModule,
        handleError(error: unknown, details: HandleErrorDetails) {
          // An aborted request is a client that left, not a fault to report.
          if (!details?.request?.signal?.aborted) {
            instrumentation
              .emit('onError', {
                error,
                request: details?.request,
                params: details?.params,
                // Distinguishes this from a throw the request handler caught.
                source: 'route',
              })
              // Reporting must not become its own failure.
              .catch(() => {});

            // React Router's default logs to the console. Providing a handler
            // replaces that default, so an application with nothing listening
            // would otherwise lose the message entirely.
            if (!instrumentation.hasHook('onError') && !applicationHandler)
              console.error(error);
          }

          return applicationHandler?.(error, details);
        },
      },
    },
  };
}

/**
 * Wraps every route's `loader` and `action` so their results pass through
 * `assertUntainted` before React Router serializes them to the client.
 *
 * This is the boundary the taint API guards: loader data is the only door
 * server objects leave through in classic mode. The scan is skipped entirely
 * while nothing has ever been tainted, so an application that never calls
 * `taintObjectReference` pays nothing here.
 */
function taintGuardedBuild(
  build: ServerBuildLike | undefined,
): ServerBuildLike | undefined {
  const routes = build?.['routes'] as
    | Record<string, { module?: Record<string, unknown> } | undefined>
    | undefined;
  if (!routes) return build;
  const guard = (fn: unknown) => {
    if (typeof fn !== 'function') return fn;
    return async (...args: unknown[]) => {
      const result: unknown = await (fn as (...call: unknown[]) => unknown)(
        ...args,
      );
      // A Response's body is bytes the application already chose to send.
      if (result instanceof Response) return result;
      const { assertUntainted } = await import('./context.js');
      return assertUntainted(result);
    };
  };
  const guarded: Record<string, unknown> = {};
  for (const [id, route] of Object.entries(routes)) {
    const module = route?.module;
    if (!module || (!module['loader'] && !module['action'])) {
      guarded[id] = route;
      continue;
    }
    guarded[id] = {
      ...route,
      module: {
        ...module,
        ...(module['loader'] ? { loader: guard(module['loader']) } : {}),
        ...(module['action'] ? { action: guard(module['action']) } : {}),
      },
    };
  }
  return { ...build, routes: guarded };
}

function createNessRequestHandler({
  build,
  requestHandler,
  mode = process.env['NODE_ENV'],
  getLoadContext,
  middleware = [],
  redirects = [],
  rewrites = [],
  headers = [],
  zones = [],
  imageHandler,
  imagePath = '/_ness/image',
  cachePolicy = defaultCachePolicy,
  // Override this alongside `cachePolicy`, not instead of it: this one decides
  // whether the cache is touched, that one decides what is kept.
  cacheableRequest = defaultCacheableRequest,
  // The flat page list from `ness-manifest.json`, carrying each page's own
  // `revalidate`/`dynamic`. Absent — a build without a manifest, a test — and
  // every page simply follows the policies above.
  pages = [],
  prerenderedPaths = [],
}: RequestHandlerOptions = {}): (
  request: Request,
  init?: HandleRequestInit,
) => Promise<Response> {
  if (!build && !requestHandler) {
    throw new TypeError(
      'createNessRequestHandler requires a React Router server build or requestHandler.',
    );
  }
  const rscHandler = build?.default?.fetch;
  const routerHandler =
    requestHandler ||
    (typeof rscHandler === 'function'
      ? (request: Request) => rscHandler(request)
      : createRouterRequestHandler(
          taintGuardedBuild(reportingBuild(build)) as unknown as ServerBuild,
          mode,
        ));
  const run = composeMiddleware(middleware, async context => {
    const url = new URL(context.request.url);
    if (imageHandler && url.pathname === imagePath)
      return imageHandler(context.request);
    // The adapter's per-call context (Workers bindings) counts only when it
    // is the shape React Router accepts; the historical `{env, ctx}` object
    // is still available to a configured getLoadContext, never passed raw.
    const adapterContext = requestStoreRef()?.loadContext;
    const loadContext = getLoadContext
      ? await getLoadContext(context.request, context)
      : adapterContext instanceof RouterContextProvider
        ? adapterContext
        : undefined;
    return routerHandler(context.request, loadContext);
  });

  // From here on, every server-side `fetch` is memoized per request and can
  // opt into the shared data cache with `{next: {revalidate, tags}}`.
  installFetchCache();
  const prerendered = new Set(
    prerenderedPaths.map(value => value.replace(/\/+$/, '') || '/'),
  );

  async function respond(
    originalRequest: Request,
    store: RequestStore,
  ): Promise<Response> {
    await instrumentation.register();
    const startedAt = performance.now();
    const id = originalRequest.headers.get('x-request-id') || randomUUID();
    let request = originalRequest;
    try {
      await instrumentation.emit('onRequest', { request, id });
      const routed = applyRoutingRules(request, { redirects, rewrites });
      if (routed.response) return routed.response;
      request = routed.request;

      // Zones first, then any rewrite that landed on another origin: both
      // mean "this URL belongs to another deployment", and the answer is
      // fetched from it rather than rendered here.
      const zone = matchZone(zones, new URL(request.url).pathname);
      if (zone) {
        const target = new URL(request.url);
        const destination = new URL(zone.destination);
        target.protocol = destination.protocol;
        target.host = destination.host;
        return proxyRequest(new Request(target, request));
      }
      if (new URL(request.url).origin !== new URL(originalRequest.url).origin) {
        return proxyRequest(request);
      }

      const cache = getCache();
      const key = `page:${request.method}:${new URL(request.url).href}`;
      const pathname = new URL(request.url).pathname;
      // A client-side navigation asks for `<path>.data`/`<path>.rsc`, but it
      // is asking *about* the page — the page's own `revalidate`/`dynamic`
      // must govern the answer either way.
      const pagePath = pagePathname(pathname);
      const pageConfig = matchPage(pages, pagePath)?.config;
      // `dynamicParams: false` closes the set of params: a URL the build did
      // not prerender is not a page, however well it matches the pattern.
      if (
        pageConfig?.dynamicParams === false &&
        !prerendered.has(pagePath.replace(/\/+$/, '') || '/')
      ) {
        return new Response('Not Found', { status: 404 });
      }
      // Fetches made under this segment inherit its declared default.
      store.fetchCacheDefault = pageConfig?.fetchCache;
      const segment = segmentCachePolicy(pageConfig);
      // Asked before the read. A request that may not be answered from the
      // shared cache must not reach into it at all.
      const cacheable =
        segment?.cacheable === false ? false : await cacheableRequest(request);
      const cached = cacheable
        ? await cache.read<SerializedResponse>(key)
        : ({ state: 'miss' } as const);
      if (cached.state !== 'miss' && cached.state !== 'stale') {
        return restoreResponse(
          cached.entry.value,
          cached.state === 'fresh' ? 'HIT' : 'STALE',
        );
      }

      if (cached.state === 'stale') {
        const staleOptions: PageCachePolicy = {
          life: cached.entry.life,
          path: cached.entry.path,
          tags: cached.entry.tags,
        };
        cache
          .refresh(
            key,
            async () => {
              let refreshed = await run({
                request,
                id,
                params: {},
                state: new Map(),
              });
              refreshed = applyHeaders(refreshed, request, headers);
              let policy = storableResponse(refreshed)
                ? ((await cachePolicy(request, refreshed)) ??
                  dataRequestPolicy(request, refreshed, segment, pagePath))
                : undefined;
              if (policy && segment?.life)
                policy = { ...policy, life: segment.life };
              if (policy) {
                const life = normalizeLife(policy.life);
                const refreshedHeaders = new Headers(refreshed.headers);
                refreshedHeaders.set(
                  'cache-control',
                  `public, max-age=0, s-maxage=${life.revalidate}, stale-while-revalidate=${Math.max(0, life.expire === Infinity ? 31536000 : life.expire - life.revalidate)}`,
                );
                refreshedHeaders.set('x-ness-cache', 'REVALIDATED');
                refreshed = new Response(refreshed.body, {
                  status: refreshed.status,
                  statusText: refreshed.statusText,
                  headers: refreshedHeaders,
                });
              }
              return serializeResponse(refreshed);
            },
            staleOptions,
          )
          .catch((error: unknown) =>
            instrumentation.emit('onError', { error, request, id }),
          );
        return restoreResponse(cached.entry.value, 'STALE');
      }

      let response = await withTimeout(
        run({ request, id, params: {}, state: new Map() }),
        pageConfig?.maxDuration,
      );
      response = applyHeaders(response, request, headers);
      // `storableResponse` gates the policy rather than being folded into it,
      // so a project that supplies its own `cachePolicy` cannot reintroduce the
      // leak by forgetting the check. `store.dynamic` is `noStore()`'s word:
      // a render that declared itself per-request is never stored.
      let policy =
        cacheable && !store.dynamic && storableResponse(response)
          ? ((await cachePolicy(request, response)) ??
            dataRequestPolicy(request, response, segment, pagePath))
          : undefined;
      // The page's own `revalidate` outranks the application-wide policy: it
      // is the more specific statement, and the one written next to the page
      // it describes.
      if (policy && segment?.life) policy = { ...policy, life: segment.life };
      if (policy) {
        const life = normalizeLife(policy.life);
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set(
          'cache-control',
          `public, max-age=0, s-maxage=${life.revalidate}, stale-while-revalidate=${Math.max(0, life.expire === Infinity ? 31536000 : life.expire - life.revalidate)}`,
        );
        responseHeaders.set('x-ness-cache', 'MISS');
        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
        const clone = response.clone();
        const stored = policy;
        serializeResponse(clone)
          .then(value => cache.write(key, value, stored))
          .catch((error: unknown) =>
            instrumentation.emit('onError', { error, request, id }),
          );
      }
      await instrumentation.emit('onResponse', {
        request,
        response,
        id,
        duration: performance.now() - startedAt,
      });
      return response;
    } catch (error) {
      await instrumentation.emit('onError', { error, request, id });
      throw error;
    }
  }

  return async function handleRequest(
    originalRequest: Request,
    init?: HandleRequestInit,
  ): Promise<Response> {
    const store = createRequestStore(originalRequest, {
      waitUntil: init?.waitUntil,
      loadContext: init?.loadContext,
    });
    const response = await runWithRequestStore(store, () =>
      respond(originalRequest, store),
    );
    return flushWhenDone(response, store);
  };
}

/**
 * Fails the request once the page's own `maxDuration` has passed.
 *
 * The render itself cannot be cancelled — React has no way to abandon a
 * loader mid-await — so the losing branch keeps running to completion; what
 * the declaration buys is that the *client* stops waiting, which is the
 * contract the option states.
 */
async function withTimeout(
  work: Promise<Response>,
  seconds: number | undefined,
): Promise<Response> {
  if (!seconds || !Number.isFinite(seconds)) return work;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<undefined>(resolve => {
    timer = setTimeout(() => resolve(undefined), seconds * 1000);
  });
  const result = await Promise.race([
    work.finally(() => clearTimeout(timer)),
    expired,
  ]);
  return (
    result ??
    new Response('Gateway Timeout', {
      status: 504,
      headers: { 'x-ness-timeout': String(seconds) },
    })
  );
}

/**
 * Runs `after()` callbacks once the response has actually been sent.
 *
 * "Sent" means the body stream closed — for a streamed render that is when
 * the last suspense boundary flushed, not when the handler returned. The
 * callbacks are attached to the stream itself, so they also run when the
 * client walks away mid-body.
 */
function flushWhenDone(response: Response, store: RequestStore): Response {
  if (!response.body) {
    if (store.deferred.length || store.pending.length)
      void flushRequestStore(store);
    return response;
  }
  let flushed = false;
  const flush = () => {
    if (flushed) return;
    flushed = true;
    void flushRequestStore(store);
  };
  const stream = response.body.pipeThrough(
    // `cancel` is a spec-recent transformer hook; the DOM lib in use does not
    // name it yet, hence the loose object.
    new TransformStream<Uint8Array, Uint8Array>({ flush, cancel: flush } as {
      flush: () => void;
      cancel: () => void;
    }),
  );
  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export {
  applyHeaders,
  applyRoutingRules,
  compilePattern,
  composeMiddleware,
  createNessRequestHandler,
  defaultCacheableRequest,
  defaultCachePolicy,
  isDataRequest,
  matchPage,
  matchPattern,
  matchZone,
  pagePathname,
  proxyRequest,
  segmentCachePolicy,
  storableResponse,
  taintGuardedBuild,
};
