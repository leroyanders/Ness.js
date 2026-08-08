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

export function requestFromEvent(event: LambdaEvent): Request;
export function eventFromResponse(response: Response): Promise<LambdaResult>;
export function createLambdaHandler(
  handler: (request: Request) => Promise<Response> | Response,
): (event: LambdaEvent) => Promise<LambdaResult>;

export default createLambdaHandler;

/**
 * A Lambda handler built from the server build and a runtime config, so the
 * cache adapter, instrumentation, headers and redirects apply here too.
 */
export function createLambdaApplication(options: {
  build: unknown;
  /** A runtime-only config module. `ness.config.mjs` cannot be used: it imports Vite. */
  config?: unknown;
  [option: string]: unknown;
}): (event: unknown) => Promise<unknown>;
