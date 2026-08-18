import { useLocation } from 'react-router';
import {
  isBareDefault,
  localizePath,
  matchAcceptLanguage,
  normalizeI18n,
  resolveLocale,
} from './i18n.js';
import type { I18nConfig, NormalizedI18nConfig } from './i18n.js';

export interface LocaleMiddlewareOptions {
  /** Cookie remembering an explicit choice. Defaults to `ness-locale`. */
  cookie?: string;
}

/**
 * The active locale inside a component. Returns the default locale on
 * unprefixed routes, so a component never has to know which strategy is in use.
 *
 * Read from the pathname rather than a route param: each locale is a static
 * segment, so there is no `:locale` param to read.
 */
function useLocale(
  i18n: I18nConfig | NormalizedI18nConfig,
): string | undefined {
  const config = normalizeI18n(i18n);
  const { pathname } = useLocation();
  return resolveLocale(pathname, config).locale;
}

/** The locale a request resolves to, from its pathname. */
function getLocale(
  request: Request,
  i18n: I18nConfig | NormalizedI18nConfig,
): string | undefined {
  const config = normalizeI18n(i18n);
  if (!config) return undefined;
  return resolveLocale(new URL(request.url).pathname, config).locale;
}

/**
 * Redirects an unprefixed request to the locale the browser asked for.
 *
 * The chosen locale is stored in a cookie and preferred over the header on
 * later visits, so an explicit language switch is not undone by the browser's
 * configuration on the next navigation.
 */
function createLocaleMiddleware(
  i18n: I18nConfig | NormalizedI18nConfig,
  { cookie = 'ness-locale' }: LocaleMiddlewareOptions = {},
): (request: Request) => Response | undefined {
  const config = normalizeI18n(i18n);
  if (!config)
    throw new TypeError('createLocaleMiddleware requires an i18n config.');

  return function localeMiddleware(request: Request): Response | undefined {
    const url = new URL(request.url);
    const resolved = resolveLocale(url.pathname, config);
    if (resolved.prefixed !== false) return undefined;

    const cookies = request.headers.get('cookie') || '';
    const stored = cookies
      .split(';')
      .map(part => part.trim().split('='))
      .find(([name]) => name === cookie)?.[1];

    const preferred =
      stored && config.locales.includes(stored)
        ? stored
        : matchAcceptLanguage(request.headers.get('accept-language'), config);

    // Only the `prefix-except-default` strategy serves the default locale at
    // the root. Under `prefix` nothing is mounted outside a locale segment, so
    // declining to redirect here would leave every unprefixed URL dead.
    if (preferred === config.defaultLocale && isBareDefault(config)) {
      return undefined;
    }

    url.pathname = localizePath(url.pathname, preferred!, config);
    return new Response(null, {
      status: 307,
      headers: {
        location: `${url.pathname}${url.search}`,
        // Caches must not serve one visitor's language to another.
        vary: 'accept-language, cookie',
        'set-cookie': `${cookie}=${preferred}; Path=/; SameSite=Lax; Max-Age=31536000`,
      },
    });
  };
}

export { createLocaleMiddleware, getLocale, useLocale };
