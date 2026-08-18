import { createRequestListener } from '@remix-run/node-fetch-server';
import '@nessframework/server/web-api';
import type { LambdaEvent, LambdaResult } from './lambda.js';

export type WebHandler = (request: Request) => Promise<Response> | Response;

export interface HealthCheckResult {
  name: string;
  healthy: boolean;
  error?: string;
}

export interface HealthHandlerOptions {
  checks?: Array<() => unknown | Promise<unknown>>;
  version?: string | undefined;
}

export interface GracefulShutdownOptions {
  /** How long in-flight requests get before the rest are cut. Default 10000. */
  timeout?: number;
  signals?: string[];
  /**
   * Run once the drain has finished, for disposing what the requests were
   * using. After, not before: disposing early breaks the requests being
   * waited for.
   */
  onShutdown?: (signal: string) => unknown | Promise<unknown>;
  /**
   * Run the moment a signal arrives, before the socket closes — the place to
   * fail readiness so the load balancer stops routing here.
   */
  onDraining?: (signal: string) => unknown | Promise<unknown>;
  /** How often idle keep-alive sockets are released. Default 100ms. */
  sweepInterval?: number;
  /** Overridable so tests can observe the exit instead of taking it. */
  exit?: (code: number) => void;
}

export interface ClosableServer {
  close(callback: (error?: Error) => void): void;
  closeIdleConnections?(): void;
  closeAllConnections?(): void;
}

function nodeAdapter(
  handler: WebHandler,
): ReturnType<typeof createRequestListener> {
  return createRequestListener(handler);
}

function expressAdapter(
  handler: WebHandler,
): (request: never, response: never) => void {
  const listener = createRequestListener(handler);
  return (request, response) => listener(request, response);
}

/**
 * Adapts a Web-standard handler to AWS Lambda (API Gateway v2 / Function URL).
 *
 * Loaded on demand so importing this package on an edge runtime does not pull
 * in the Node buffer path the conversion needs.
 */
async function serverlessAdapter(
  handler: WebHandler,
): Promise<(event: LambdaEvent) => Promise<LambdaResult>> {
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
function edgeAdapter(handler: WebHandler): { fetch: WebHandler } {
  return { fetch: handler };
}

function createHealthHandler({
  checks = [],
  version = process.env['npm_package_version'],
}: HealthHandlerOptions = {}): WebHandler {
  return async function health() {
    const results = await Promise.all(
      checks.map(async (check): Promise<HealthCheckResult> => {
        try {
          await check();
          return { name: check.name || 'anonymous', healthy: true };
        } catch (error) {
          return {
            name: check.name || 'anonymous',
            healthy: false,
            error: error instanceof Error ? error.message : String(error),
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

/**
 * Stops taking traffic, lets in-flight requests finish, then exits.
 *
 * Three things a rolling deploy needs, in this order.
 *
 * Readiness fails first, through `onDraining`. A load balancer needs a poll
 * cycle to notice; anything it routes here after the socket closes is a request
 * the visitor sees fail.
 *
 * Idle keep-alive sockets are released. `server.close` waits for every
 * connection, and a browser holds a keep-alive socket open long after its last
 * request — so without this the close never resolves, the grace period expires,
 * and the in-flight requests this was meant to protect are killed with the
 * process. The sweep repeats because a connection serving a request now falls
 * idle a moment later.
 *
 * Cleanup runs after the drain, not before. Disposing the API layer while
 * requests are still using it breaks exactly the requests being waited for.
 */
function gracefulShutdown(
  server: ClosableServer,
  {
    timeout = 10_000,
    signals = ['SIGINT', 'SIGTERM'],
    onShutdown,
    onDraining,
    sweepInterval = 100,
    exit = code => process.exit(code),
  }: GracefulShutdownOptions = {},
): () => void {
  let closing = false;

  const close = async (signal: string) => {
    if (closing) return;
    closing = true;

    try {
      await onDraining?.(signal);
    } catch {
      // A failed readiness flip must not stop the drain.
    }

    const expire = setTimeout(() => {
      // The grace period is spent. Cut what is left, so the exit is ours and
      // the reason is logged, rather than an unexplained SIGKILL.
      server.closeAllConnections?.();
      exit(1);
    }, timeout);
    expire.unref?.();

    const sweep = setInterval(
      () => server.closeIdleConnections?.(),
      sweepInterval,
    );
    sweep.unref?.();

    try {
      const drained = new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      );
      server.closeIdleConnections?.();
      await drained;
      await onShutdown?.(signal);
      clearInterval(sweep);
      clearTimeout(expire);
      exit(0);
    } catch {
      clearInterval(sweep);
      clearTimeout(expire);
      exit(1);
    }
  };

  for (const signal of signals)
    process.once(signal as NodeJS.Signals, () => {
      void close(signal);
    });
  return () =>
    signals.forEach(signal =>
      process.removeAllListeners(signal as NodeJS.Signals),
    );
}

export {
  createHealthHandler,
  edgeAdapter,
  expressAdapter,
  gracefulShutdown,
  nodeAdapter,
  serverlessAdapter,
};
