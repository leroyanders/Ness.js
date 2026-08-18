import { randomUUID } from 'node:crypto';
import { createRequestHandler as createRouterRequestHandler } from 'react-router';
import type { RouterContextProvider, ServerBuild } from 'react-router';
import { getCache, normalizeLife } from '@nessframework/cache';
import type { CacheLife, CacheProfile } from '@nessframework/cache';
import * as instrumentation from '@nessframework/instrumentation';

export * from './responses.js';
export * from './draft.js';

export interface RoutingRule {
  source: string | RegExp;
  destination: string;
  status?: number;
  permanent?: boolean;
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

/** What a page declares about its own caching, read from the manifest. */
export interface SegmentConfig {
  revalidate?: number | false;
  dynamic?: 'force-dynamic' | 'force-static' | 'auto';
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

function createNessRequestHandler({
  build,
  requestHandler,
  mode = process.env['NODE_ENV'],
  getLoadContext,
  middleware = [],
  redirects = [],
  rewrites = [],
  headers = [],
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
}: RequestHandlerOptions = {}): (request: Request) => Promise<Response> {
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
          reportingBuild(build) as unknown as ServerBuild,
          mode,
        ));
  const run = composeMiddleware(middleware, async context => {
    const url = new URL(context.request.url);
    if (imageHandler && url.pathname === imagePath)
      return imageHandler(context.request);
    const loadContext = getLoadContext
      ? await getLoadContext(context.request, context)
      : undefined;
    return routerHandler(context.request, loadContext);
  });

  return async function handleRequest(
    originalRequest: Request,
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

      const cache = getCache();
      const key = `page:${request.method}:${new URL(request.url).href}`;
      const segment = segmentCachePolicy(
        matchPage(pages, new URL(request.url).pathname)?.config,
      );
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
                ? await cachePolicy(request, refreshed)
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

      let response = await run({ request, id, params: {}, state: new Map() });
      response = applyHeaders(response, request, headers);
      // `storableResponse` gates the policy rather than being folded into it,
      // so a project that supplies its own `cachePolicy` cannot reintroduce the
      // leak by forgetting the check.
      let policy =
        cacheable && storableResponse(response)
          ? await cachePolicy(request, response)
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
  };
}

export {
  applyHeaders,
  applyRoutingRules,
  compilePattern,
  composeMiddleware,
  createNessRequestHandler,
  defaultCacheableRequest,
  defaultCachePolicy,
  matchPage,
  matchPattern,
  segmentCachePolicy,
  storableResponse,
};
