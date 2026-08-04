export interface WorkerHandlerOptions {
  /** The server build: `import * as build from './build/server/index.js'`. */
  build: unknown;
  /** Name of the static assets binding. Defaults to `ASSETS`. */
  assets?: string;
  getLoadContext?: (context: {
    request: Request;
    env: Record<string, unknown>;
    context: unknown;
  }) => unknown | Promise<unknown>;
  [option: string]: unknown;
}

export interface WorkerConfigOptions {
  name?: string;
  compatibilityDate?: string;
  buildDirectory?: string;
  main?: string;
}

export function createWorkerHandler(options: WorkerHandlerOptions): {
  fetch(
    request: Request,
    env: Record<string, unknown>,
    context: unknown,
  ): Promise<Response>;
};

export function createWorkerConfig(
  options?: WorkerConfigOptions,
): Record<string, unknown>;

export const WORKER_ENTRY: string;

export default createWorkerHandler;
