import type { NestOptions } from './index.js';

export function createNestMiddleware(
  options?: Record<string, unknown>,
): Promise<{
  application: { close(): Promise<void> };
  middleware: (request: unknown, response: unknown, next: () => void) => void;
  handler: (request: unknown, response: unknown, next: () => void) => void;
}>;
export function nestServer(
  options?: NestOptions & { module?: string },
): (
  server: { use(handler: unknown): void },
  context?: { root?: string },
) => Promise<() => Promise<void>>;
