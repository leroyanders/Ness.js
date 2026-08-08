import { randomUUID } from 'node:crypto';
import { createRequestHandler as createRouterRequestHandler } from 'react-router';
import { getCache, normalizeLife } from '@nessframework/cache';
import * as instrumentation from '@nessframework/instrumentation';
import * as responses from './responses.js';

export * from './responses.js';

function compilePattern(pattern) {
  if (pattern instanceof RegExp) return pattern;
  const names = [];
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
        names.push(match[1]);
        return match[2] ? '(.*)' : '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const expression = new RegExp(`^${source}/?$`);
  expression.names = names;
  return expression;
}

function matchPattern(pattern, pathname) {
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

function interpolate(destination, params) {
  return destination.replace(
    /:([A-Za-z0-9_]+)\*?/g,
    (_value, name) => params[name] || '',
  );
}

function applyRoutingRules(request, { redirects = [], rewrites = [] } = {}) {
  const url = new URL(request.url);
  for (const rule of redirects) {
    const params = matchPattern(rule.source, url.pathname);
    if (!params) continue;
    const destination = new URL(interpolate(rule.destination, params), url);
    return {
      response: Response.redirect(
        destination,
        rule.status || (rule.permanent ? 308 : 307),
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

function applyHeaders(response, request, rules = []) {
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

function composeMiddleware(middleware, finalHandler) {
  return function execute(initialContext) {
    let current = -1;
    const dispatch = index => {
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

async function serializeResponse(response) {
  return {
    body: await response.arrayBuffer(),
    headers: [...response.headers],
    status: response.status,
    statusText: response.statusText,
  };
}

function restoreResponse(serialized, state) {
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
function defaultCacheableRequest(request) {
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
function storableResponse(response) {
  return !response.headers.has('set-cookie');
}

function defaultCachePolicy(request, response) {
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
function reportingBuild(build) {
  const entryModule = build?.entry?.module;
  if (!entryModule) return build;

  const applicationHandler = entryModule.handleError;

  return {
    ...build,
    entry: {
      ...build.entry,
      module: {
        ...entryModule,
        handleError(error, details) {
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
  mode = process.env.NODE_ENV,
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
} = {}) {
  if (!build && !requestHandler) {
    throw new TypeError(
      'createNessRequestHandler requires a React Router server build or requestHandler.',
    );
  }
  const rscHandler = build?.default?.fetch;
  const routerHandler =
    requestHandler ||
    (typeof rscHandler === 'function'
      ? request => rscHandler(request)
      : createRouterRequestHandler(reportingBuild(build), mode));
  const run = composeMiddleware(middleware, async context => {
    const url = new URL(context.request.url);
    if (imageHandler && url.pathname === imagePath)
      return imageHandler(context.request);
    const loadContext = getLoadContext
      ? await getLoadContext(context.request, context)
      : undefined;
    return routerHandler(context.request, loadContext);
  });

  return async function handleRequest(originalRequest) {
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
      // Asked before the read. A request that may not be answered from the
      // shared cache must not reach into it at all.
      const cacheable = await cacheableRequest(request);
      const cached = cacheable ? await cache.read(key) : { state: 'miss' };
      if (cached.state !== 'miss' && cached.state !== 'stale') {
        return restoreResponse(
          cached.entry.value,
          cached.state === 'fresh' ? 'HIT' : 'STALE',
        );
      }

      if (cached.state === 'stale') {
        const staleOptions = {
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
              const policy = storableResponse(refreshed)
                ? await cachePolicy(request, refreshed)
                : undefined;
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
          .catch(error =>
            instrumentation.emit('onError', { error, request, id }),
          );
        return restoreResponse(cached.entry.value, 'STALE');
      }

      let response = await run({ request, id, params: {}, state: new Map() });
      response = applyHeaders(response, request, headers);
      // `storableResponse` gates the policy rather than being folded into it,
      // so a project that supplies its own `cachePolicy` cannot reintroduce the
      // leak by forgetting the check.
      const policy =
        cacheable && storableResponse(response)
          ? await cachePolicy(request, response)
          : undefined;
      if (policy) {
        const life = normalizeLife(policy.life);
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set(
          'cache-control',
          `public, max-age=0, s-maxage=${life.revalidate}, stale-while-revalidate=${Math.max(0, life.expire === Infinity ? 31536000 : life.expire - life.revalidate)}`,
        );
        responseHeaders.set(
          'x-ness-cache',
          cached.state === 'stale' ? 'REVALIDATED' : 'MISS',
        );
        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
        const clone = response.clone();
        serializeResponse(clone)
          .then(value => cache.write(key, value, policy))
          .catch(error =>
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
  matchPattern,
  storableResponse,
};
