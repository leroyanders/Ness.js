export * from './responses.js';
import type { RouterContextProvider } from 'react-router';
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
export interface RequestHandlerOptions {
  build?: unknown;
  requestHandler?: (
    request: Request,
    context?: unknown,
  ) => Promise<Response> | Response;
  mode?: string;
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
  ) => unknown | Promise<unknown>;
  /**
   * Whether the page cache is touched at all for this request.
   *
   * Consulted before the read, so a request this refuses is neither answered
   * from the cache nor stored in it. Override it alongside `cachePolicy`, not
   * instead of it.
   */
  cacheableRequest?: (request: Request) => boolean | Promise<boolean>;
}
export function createNessRequestHandler(
  options: RequestHandlerOptions,
): (request: Request) => Promise<Response>;
/** GET, and no `cookie` or `authorization` header. */
export function defaultCacheableRequest(request: Request): boolean;
/** False for a response carrying `set-cookie`, which belongs to one visitor. */
export function storableResponse(response: Response): boolean;
export function compilePattern(pattern: string | RegExp): RegExp;
export function matchPattern(
  pattern: string | RegExp,
  pathname: string,
): Record<string, string> | undefined;
export function composeMiddleware(
  middleware: Middleware[],
  finalHandler: Middleware,
): Middleware;
export function applyRoutingRules(
  request: Request,
  rules?: { redirects?: RoutingRule[]; rewrites?: RoutingRule[] },
): { request?: Request; response?: Response };
export function applyHeaders(
  response: Response,
  request: Request,
  rules?: HeaderRule[],
): Response;
