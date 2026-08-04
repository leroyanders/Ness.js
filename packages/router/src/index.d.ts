import type { Config } from '@react-router/dev/config';
import type { RouteConfig } from '@react-router/dev/routes';
import type { UserConfig } from 'vite';

export const ROUTE_EXTENSIONS: string[];
export const RESERVED_FILES: string[];
export function segmentPath(segment: string): string | undefined;

export type I18nStrategy = 'prefix' | 'prefix-except-default';

export interface I18nConfig {
  /** BCP 47 tags, for example `['en', 'de', 'pt-BR']`. */
  locales: string[];
  /** Defaults to the first entry in `locales`. */
  defaultLocale?: string;
  /**
   * `prefix-except-default` (default) serves the default locale at `/` and the
   * rest under `/<locale>/`. `prefix` prefixes every locale.
   */
  strategy?: I18nStrategy;
}

export interface NormalizedI18nConfig {
  locales: string[];
  defaultLocale: string;
  strategy: I18nStrategy;
}

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
  /**
   * Validated here and recorded in the build manifest. Pass the same object to
   * `nessRoutes({ i18n })` in `app/routes.ts` to generate localized routes.
   */
  i18n?: I18nConfig;
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
  /** Mounts the route tree under a `:locale` segment. */
  i18n?: I18nConfig;
}): Promise<RouteConfig>;
export const defineRoutes: typeof nessRoutes;

export function normalizeI18n(
  config?: I18nConfig,
): NormalizedI18nConfig | undefined;

/** Splits a pathname into its locale and the remainder. */
export function resolveLocale(
  pathname: string,
  i18n?: NormalizedI18nConfig,
): { locale?: string; pathname: string; prefixed?: false };

/** Rewrites a pathname to another locale. */
export function localizePath(
  pathname: string,
  locale: string,
  i18n?: NormalizedI18nConfig,
): string;

/** Best match from an Accept-Language header, with region fallback. */
export function matchAcceptLanguage(
  header: string | null | undefined,
  i18n?: NormalizedI18nConfig,
): string | undefined;

declare const config: {
  DEFAULT_CACHE_PROFILES: typeof DEFAULT_CACHE_PROFILES;
  defineConfig: typeof defineConfig;
  defineNessConfig: typeof defineNessConfig;
  defineRoutes: typeof defineRoutes;
  nessRoutes: typeof nessRoutes;
  resolveNessRouterConfig: typeof resolveNessRouterConfig;
};

export default config;
