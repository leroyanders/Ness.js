import type { Middleware } from '@nessframework/server';

const timingMiddleware: Middleware = async ({ request }, next) => {
  const startedAt = performance.now();
  const result = await next();

  if (!(result instanceof Response)) return result;
  const headers = new Headers(result.headers);
  headers.set(
    'server-timing',
    `ness;dur=${(performance.now() - startedAt).toFixed(1)}`,
  );
  headers.set('x-ness-route', new URL(request.url).pathname);
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
};

export default timingMiddleware;
