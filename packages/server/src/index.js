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

function defaultCachePolicy(request, response) {
  if (request.method !== 'GET' || response.status !== 200) return undefined;
  if (request.headers.has('authorization') || request.headers.has('cookie'))
    return undefined;
  if (!(response.headers.get('content-type') || '').includes('text/html'))
    return undefined;
  return {
    life: 'default',
    path: new URL(request.url).pathname,
    tags: ['pages'],
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
      : createRouterRequestHandler(build, mode));
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
      const cached = await cache.read(key);
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
              const policy = await cachePolicy(request, refreshed);
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
      const policy = await cachePolicy(request, response);
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
  defaultCachePolicy,
  matchPattern,
};
