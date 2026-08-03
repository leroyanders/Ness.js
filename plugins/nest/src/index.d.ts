import type { Plugin } from 'vite';

export interface NestOptions {
  root?: string;
  source?: string;
  outDir?: string;
  prefix?: string;
  logger?: Array<'error' | 'warn' | 'log' | 'debug' | 'verbose' | 'fatal'>;
}

export function nest(options?: NestOptions): Plugin;
export function buildNestApplication(
  options?: NestOptions,
): Promise<string | null>;
export function createNestMiddleware(
  options?: Record<string, unknown>,
): Promise<{
  application: { close(): Promise<void> };
  middleware: (request: unknown, response: unknown, next: () => void) => void;
  handler: (request: unknown, response: unknown, next: () => void) => void;
}>;
export default nest;
