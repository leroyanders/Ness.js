import type { I18nConfig, NormalizedI18nConfig } from './index.js';

/** The active locale inside a component. */
export function useLocale(
  i18n: I18nConfig | NormalizedI18nConfig,
): string | undefined;

/** The locale a request resolves to, from its pathname. */
export function getLocale(
  request: Request,
  i18n: I18nConfig | NormalizedI18nConfig,
): string | undefined;

export interface LocaleMiddlewareOptions {
  /** Cookie remembering an explicit choice. Defaults to `ness-locale`. */
  cookie?: string;
}

/**
 * Redirects unprefixed requests to the visitor's preferred locale. Returns
 * `undefined` when the request already carries a locale or resolves to the
 * default one.
 */
export function createLocaleMiddleware(
  i18n: I18nConfig | NormalizedI18nConfig,
  options?: LocaleMiddlewareOptions,
): (request: Request) => Response | undefined;
