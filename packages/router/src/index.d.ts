import type { Config } from '@react-router/dev/config';
import type { RouteConfig } from '@react-router/dev/routes';
import type { UserConfig } from 'vite';

export const ROUTE_EXTENSIONS: string[];
export const RESERVED_FILES: string[];
export function segmentPath(segment: string): string | undefined;

export interface NessConfig extends Config {
  cache?: {
    profiles?: Record<
      string,
      { stale: number; revalidate: number; expire: number }
    >;
  };
  deployment?: {
    runtime?: 'node' | 'edge' | 'serverless';
    [key: string]: unknown;
  };
  routeDirectory?: string;
  rsc?: boolean;
}

export interface UnifiedNessConfig {
  vite?: UserConfig;
  router?: NessConfig;
  server?: Record<string, unknown>;
  instrumentation?: {
    register?(): void | Promise<void>;
    onError?(context: { error: unknown }): void | Promise<void>;
    [hook: string]: unknown;
  };
}

export interface ResolvedUnifiedNessConfig extends UserConfig {
  ness: {
    router: NessConfig;
    server: Record<string, unknown>;
    instrumentation?: UnifiedNessConfig['instrumentation'];
  };
}

export const DEFAULT_CACHE_PROFILES: Record<
  string,
  { stale: number; revalidate: number; expire: number }
>;
export function defineConfig(options?: NessConfig): Config;
export function defineNessConfig(
  options?: UnifiedNessConfig,
): ResolvedUnifiedNessConfig;
export function resolveNessRouterConfig(
  config: ResolvedUnifiedNessConfig,
  root?: string,
): Config;
export function nessRoutes(options?: {
  appDirectory?: string;
  routesDirectory?: string;
  generatedDirectory?: string;
}): Promise<RouteConfig>;
export const defineRoutes: typeof nessRoutes;

declare const config: {
  DEFAULT_CACHE_PROFILES: typeof DEFAULT_CACHE_PROFILES;
  defineConfig: typeof defineConfig;
  defineNessConfig: typeof defineNessConfig;
  defineRoutes: typeof defineRoutes;
  nessRoutes: typeof nessRoutes;
  resolveNessRouterConfig: typeof resolveNessRouterConfig;
};

export default config;
