import { createRequestListener } from '@remix-run/node-fetch-server';
import '@nessframework/server/web-api';

function nodeAdapter(handler) {
  return createRequestListener(handler);
}

function expressAdapter(handler) {
  const listener = createRequestListener(handler);
  return (request, response) => listener(request, response);
}

/**
 * Adapts a Web-standard handler to AWS Lambda (API Gateway v2 / Function URL).
 *
 * Loaded on demand so importing this package on an edge runtime does not pull
 * in the Node buffer path the conversion needs.
 */
async function serverlessAdapter(handler) {
  const { createLambdaHandler } = await import('./lambda.js');
  return createLambdaHandler(handler);
}

/**
 * Shapes a handler as an edge module export. This is the whole adapter on
 * runtimes that already speak Request/Response — Cloudflare Workers, Deno
 * Deploy, Netlify Edge. For Workers specifically, use
 * `@nessframework/deployment/cloudflare`, which also wires the static assets
 * binding.
 */
function edgeAdapter(handler) {
  return { fetch: handler };
}

function createHealthHandler({
  checks = [],
  version = process.env.npm_package_version,
} = {}) {
  return async function health() {
    const results = await Promise.all(
      checks.map(async check => {
        try {
          await check();
          return { name: check.name || 'anonymous', healthy: true };
        } catch (error) {
          return {
            name: check.name || 'anonymous',
            healthy: false,
            error: error.message,
          };
        }
      }),
    );
    const healthy = results.every(result => result.healthy);
    return Response.json(
      { healthy, version, checks: results },
      {
        status: healthy ? 200 : 503,
        headers: { 'cache-control': 'no-store' },
      },
    );
  };
}

function gracefulShutdown(
  server,
  { timeout = 10_000, signals = ['SIGINT', 'SIGTERM'], onShutdown } = {},
) {
  let closing = false;
  const close = signal => {
    if (closing) return;
    closing = true;
    const timer = setTimeout(() => process.exit(1), timeout).unref();
    Promise.resolve(onShutdown?.(signal))
      .then(
        () =>
          new Promise((resolve, reject) =>
            server.close(error => (error ? reject(error) : resolve())),
          ),
      )
      .then(() => {
        clearTimeout(timer);
        process.exit(0);
      })
      .catch(() => process.exit(1));
  };
  for (const signal of signals) process.once(signal, () => close(signal));
  return () => signals.forEach(signal => process.removeAllListeners(signal));
}

export {
  createHealthHandler,
  edgeAdapter,
  expressAdapter,
  gracefulShutdown,
  nodeAdapter,
  serverlessAdapter,
};
