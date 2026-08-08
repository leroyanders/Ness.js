export interface RuntimeConfigResult {
  /** The `server` section, including process-level options. */
  server: Record<string, unknown>;
  /** Just the part `createNessRequestHandler` understands. */
  options: Record<string, unknown>;
}

/** Options that configure the process rather than a request. */
export const PROCESS_OPTIONS: Set<string>;

/** Normalises a module namespace, a `defineNessConfig` result, or a plain object. */
export function serverConfig(config: unknown): {
  server: Record<string, unknown>;
  instrumentation?: unknown;
};

/** The subset of the server config the request handler accepts. */
export function handlerOptions(
  server: Record<string, unknown>,
): Record<string, unknown>;

/**
 * Registers the configured instrumentation and cache adapter, and returns the
 * handler options. Call once per process.
 */
export function applyRuntimeConfig(
  config: unknown,
): Promise<RuntimeConfigResult>;
