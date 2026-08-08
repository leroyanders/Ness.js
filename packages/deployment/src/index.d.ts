export type WebHandler = (request: Request) => Promise<Response> | Response;
export function nodeAdapter(
  handler: WebHandler,
): (request: unknown, response: unknown) => void;
export const expressAdapter: typeof nodeAdapter;
export function serverlessAdapter(handler: WebHandler): WebHandler;
export function edgeAdapter(handler: WebHandler): { fetch: WebHandler };
export function createHealthHandler(options?: {
  checks?: Array<() => unknown | Promise<unknown>>;
  version?: string;
}): WebHandler;
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

export function gracefulShutdown(
  server: {
    close(callback: (error?: Error) => void): void;
    closeIdleConnections?(): void;
    closeAllConnections?(): void;
  },
  options?: GracefulShutdownOptions,
): () => void;
