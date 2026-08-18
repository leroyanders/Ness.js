import { setCache } from '@nessframework/cache';
import { resolveCache } from '@nessframework/cache/resolve';
import type { CacheConfig } from '@nessframework/cache/resolve';
import { registerInstrumentation } from '@nessframework/instrumentation';
import type { Instrumentation } from '@nessframework/instrumentation';

export interface RuntimeConfigResult {
  /** The `server` section, including process-level options. */
  server: Record<string, unknown>;
  /** Just the part `createNessRequestHandler` understands. */
  options: Record<string, unknown>;
}

export interface ServerConfigResult {
  server: Record<string, unknown>;
  instrumentation?: Instrumentation | undefined;
}

/**
 * The runtime half of `ness.config.mjs`, applied the same way on every target.
 *
 * `ness start` used to be the only place that read the config, so a Worker or a
 * Lambda ran with no cache adapter, no instrumentation, and none of the
 * configured headers or redirects — quietly, because nothing announced that the
 * settings had been skipped. This is the one place that turns a config into
 * handler options, so the three entry points cannot drift.
 */

/**
 * Options that configure the server process rather than a request.
 *
 * Kept out of the handler options so an unknown key reaching
 * `createNessRequestHandler` stays a signal rather than noise.
 */
const PROCESS_OPTIONS = new Set([
  'cache',
  'compression',
  'configureServer',
  'images',
  'port',
  'host',
  'shutdownTimeout',
  'trustProxy',
]);

/** Every shape the config may arrive in, before it is normalised. */
interface RawConfig {
  default?: RawConfig;
  ness?: {
    server?: Record<string, unknown>;
    instrumentation?: Instrumentation;
  };
  server?: Record<string, unknown>;
  instrumentation?: Instrumentation;
}

/**
 * Accepts what any of the config shapes hands over: a module namespace, the
 * `defineNessConfig` result with its `ness` key, or a plain server object.
 */
function serverConfig(config: unknown): ServerConfigResult {
  const candidate = config as RawConfig | null | undefined;
  const root: RawConfig = candidate?.default ?? candidate ?? {};
  if (root.ness) {
    return {
      server: root.ness.server || {},
      instrumentation: root.ness.instrumentation,
    };
  }
  if (root.server || root.instrumentation) {
    return { server: root.server || {}, instrumentation: root.instrumentation };
  }
  return {
    server: root as Record<string, unknown>,
    instrumentation: undefined,
  };
}

/** The subset of the server config that `createNessRequestHandler` accepts. */
function handlerOptions(
  server: Record<string, unknown>,
): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(server)) {
    if (!PROCESS_OPTIONS.has(key)) options[key] = value;
  }
  return options;
}

/**
 * Registers the instrumentation and the cache adapter the config asks for.
 *
 * Separate from building the handler because both are process-wide side
 * effects: a target that builds several handlers must not register twice.
 */
async function applyRuntimeConfig(
  config: unknown,
): Promise<RuntimeConfigResult> {
  const { server, instrumentation } = serverConfig(config);

  if (instrumentation) registerInstrumentation(instrumentation);

  const cache = await resolveCache(server['cache'] as CacheConfig | undefined);
  if (cache) setCache(cache);

  return { server, options: handlerOptions(server) };
}

export { PROCESS_OPTIONS, applyRuntimeConfig, handlerOptions, serverConfig };
