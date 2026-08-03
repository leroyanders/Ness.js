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
export function gracefulShutdown(
  server: { close(callback: (error?: Error) => void): void },
  options?: Record<string, unknown>,
): () => void;
