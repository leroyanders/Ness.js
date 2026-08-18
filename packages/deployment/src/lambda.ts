import '@nessframework/server/web-api';
import type { ServerBuildLike } from '@nessframework/server';

/** `BodyInit` is a DOM lib name; taken from the constructor that consumes it. */
type BodyInit = ConstructorParameters<typeof Request>[1] extends
  { body?: infer B } | undefined
  ? B
  : never;

export interface LambdaResult {
  statusCode: number;
  headers: Record<string, string>;
  cookies?: string[];
  body: string;
  isBase64Encoded: boolean;
}

/** API Gateway v2 / Function URL payload. v1 (REST API) is not supported. */
export interface LambdaEvent {
  rawPath?: string;
  rawQueryString?: string;
  headers?: Record<string, string | undefined>;
  cookies?: string[];
  body?: string | null;
  isBase64Encoded?: boolean;
  requestContext?: { http?: { method?: string } };
}

export type WebHandler = (request: Request) => Promise<Response> | Response;

export interface LambdaApplicationOptions {
  build?: unknown;
  /**
   * A runtime-only config module. `ness.config.mjs` cannot be used: it imports
   * Vite.
   */
  config?: unknown;
  [option: string]: unknown;
}

const BINARY_TYPES = [
  /^image\//,
  /^audio\//,
  /^video\//,
  /^font\//,
  /^application\/(?:octet-stream|pdf|zip|wasm)$/,
];

/**
 * A content-type header carries parameters — `image/png; charset=binary`, or a
 * multipart boundary — so the media type has to be isolated before matching.
 * Anchoring the pattern against the whole header would classify those as text
 * and corrupt the body.
 */
function isBinary(contentType = ''): boolean {
  const mediaType = contentType.split(';')[0]!.trim().toLowerCase();
  return BINARY_TYPES.some(pattern => pattern.test(mediaType));
}

/**
 * API Gateway v2 and Function URLs both use this payload shape. v1 (REST API)
 * is not supported: it splits query parameters differently and is being phased
 * out by AWS in favour of v2.
 */
function requestFromEvent(event: LambdaEvent): Request {
  const http = event.requestContext?.http;
  if (!http) {
    throw new TypeError(
      'Unsupported Lambda event: expected an API Gateway v2 or Function URL payload (requestContext.http is missing).',
    );
  }

  const headers = new Headers();
  for (const [name, value] of Object.entries(event.headers || {})) {
    if (value !== undefined) headers.set(name, value);
  }
  for (const cookie of event.cookies || []) headers.append('cookie', cookie);

  const host =
    headers.get('x-forwarded-host') || headers.get('host') || 'localhost';
  const protocol = headers.get('x-forwarded-proto') || 'https';
  const query = event.rawQueryString ? `?${event.rawQueryString}` : '';
  const url = `${protocol}://${host}${event.rawPath || '/'}${query}`;

  const method = http.method || 'GET';
  const body =
    method === 'GET' || method === 'HEAD' || event.body == null
      ? undefined
      : event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : event.body;

  return new Request(url, {
    method,
    headers,
    body: body as BodyInit | undefined,
  });
}

async function eventFromResponse(response: Response): Promise<LambdaResult> {
  const headers: Record<string, string> = {};
  const cookies: string[] = [];
  for (const [name, value] of response.headers) {
    if (name.toLowerCase() === 'set-cookie') cookies.push(value);
    else headers[name] = value;
  }
  // getSetCookie preserves multiple cookies that the iterator above folds into
  // one comma-joined header.
  if (typeof response.headers.getSetCookie === 'function') {
    cookies.length = 0;
    cookies.push(...response.headers.getSetCookie());
  }

  const binary = isBinary(response.headers.get('content-type') || '');
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    statusCode: response.status,
    headers,
    ...(cookies.length ? { cookies } : {}),
    body: binary ? buffer.toString('base64') : buffer.toString('utf8'),
    isBase64Encoded: binary,
  };
}

/**
 * Wraps a Web-standard handler as an AWS Lambda handler for API Gateway v2 or
 * a Function URL.
 *
 * Responses are buffered, because a buffered Lambda response is the only shape
 * API Gateway accepts. Streaming SSR still renders correctly, but the client
 * receives it in one piece — deploy to a Node or container target if
 * time-to-first-byte matters.
 */
function createLambdaHandler(
  handler: WebHandler,
): (event: LambdaEvent) => Promise<LambdaResult> {
  if (typeof handler !== 'function') {
    throw new TypeError('createLambdaHandler requires a fetch handler.');
  }
  return async function lambda(event: LambdaEvent) {
    const response = await handler(requestFromEvent(event));
    return eventFromResponse(response);
  };
}

/** What `prepare` assembles once and every request then reuses. */
interface PreparedApplication {
  handler: WebHandler;
  server: Record<string, unknown>;
  applyForwardedHeaders: (
    request: Request,
    options?: { trustProxy?: boolean },
  ) => Request;
}

/**
 * The same handler, built from a server build and a config.
 *
 * `createLambdaHandler` takes a fetch handler you have already assembled, which
 * left every Lambda deployment to wire the cache adapter, the instrumentation
 * and the configured headers by hand — and, in practice, to skip them. This
 * applies the runtime config the way `ness start` does.
 *
 * The config is imported by the caller rather than read from disk: a Lambda
 * bundle has no project directory, and `ness.config.mjs` cannot be imported
 * here anyway because it pulls in Vite. Point it at a runtime-only config.
 */
function createLambdaApplication({
  build,
  config,
  ...handlerOptions
}: LambdaApplicationOptions = {}): (
  event: LambdaEvent,
) => Promise<LambdaResult> {
  if (!build) {
    throw new TypeError(
      'createLambdaApplication requires the server build: import * as build from "./build/server/index.js".',
    );
  }

  let ready: Promise<PreparedApplication> | undefined;
  const prepare = async (): Promise<PreparedApplication> => {
    const { createNessRequestHandler } = await import('@nessframework/server');
    const { applyForwardedHeaders } =
      await import('@nessframework/server/proxy');
    const { applyRuntimeConfig } =
      await import('@nessframework/server/runtime');
    const { server, options } = await applyRuntimeConfig(config);
    const handler = createNessRequestHandler({
      build: build as ServerBuildLike,
      ...options,
      ...handlerOptions,
    });
    return { handler, server, applyForwardedHeaders };
  };

  return createLambdaHandler(async request => {
    ready ??= prepare();
    const { handler, server, applyForwardedHeaders } = await ready;
    // API Gateway terminates TLS and forwards the original scheme.
    return handler(
      applyForwardedHeaders(request, {
        trustProxy: server['trustProxy'] === true,
      }),
    );
  });
}

export {
  createLambdaApplication,
  createLambdaHandler,
  eventFromResponse,
  requestFromEvent,
};
export default createLambdaHandler;
