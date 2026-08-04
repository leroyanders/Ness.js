const STRATEGIES = new Set(['prefix', 'prefix-except-default']);

/**
 * Validates and fills in an i18n configuration.
 *
 * Two strategies are supported:
 *
 * - `prefix-except-default` (the default): the default locale is served at `/`
 *   and every other locale under `/<locale>/`. Existing URLs keep working when
 *   a site adds translations, which is why it is the default.
 * - `prefix`: every locale is prefixed, including the default. Symmetrical, and
 *   the right choice when no locale should be privileged.
 */
function normalizeI18n(config) {
  if (!config) return undefined;
  const { locales, defaultLocale, strategy = 'prefix-except-default' } = config;

  if (!Array.isArray(locales) || locales.length === 0) {
    throw new TypeError('i18n.locales must be a non-empty array.');
  }
  for (const locale of locales) {
    if (
      typeof locale !== 'string' ||
      !/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(locale)
    ) {
      throw new TypeError(
        `Invalid locale: ${locale}. Use BCP 47 tags such as "en" or "pt-BR".`,
      );
    }
  }
  if (new Set(locales).size !== locales.length) {
    throw new TypeError('i18n.locales must not contain duplicates.');
  }

  const fallback = defaultLocale || locales[0];
  if (!locales.includes(fallback)) {
    throw new TypeError(
      `i18n.defaultLocale (${fallback}) must be one of i18n.locales.`,
    );
  }
  if (!STRATEGIES.has(strategy)) {
    throw new TypeError(
      `Unknown i18n.strategy: ${strategy}. Use ${[...STRATEGIES].join(' or ')}.`,
    );
  }

  return { locales: [...locales], defaultLocale: fallback, strategy };
}

/** True when the default locale is served without a prefix. */
function isBareDefault(i18n) {
  return i18n.strategy === 'prefix-except-default';
}

/**
 * Splits a pathname into its locale and the remainder. An unknown or absent
 * prefix yields the default locale and the pathname unchanged, so callers never
 * have to special-case it.
 */
function resolveLocale(pathname, i18n) {
  if (!i18n) return { locale: undefined, pathname };
  const [, first = '', ...rest] = pathname.split('/');
  if (i18n.locales.includes(first)) {
    return { locale: first, pathname: `/${rest.join('/')}` };
  }
  return { locale: i18n.defaultLocale, pathname, prefixed: false };
}

/** Rewrites a pathname to the given locale. Inverse of `resolveLocale`. */
function localizePath(pathname, locale, i18n) {
  if (!i18n) return pathname;
  if (!i18n.locales.includes(locale)) {
    throw new RangeError(`Unknown locale: ${locale}`);
  }
  const { pathname: bare } = resolveLocale(pathname, i18n);
  if (locale === i18n.defaultLocale && isBareDefault(i18n)) return bare || '/';
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
}

/**
 * Picks the best locale from an Accept-Language header, honouring quality
 * values and falling back from a region to its base language ("de-AT" matches a
 * configured "de").
 */
function matchAcceptLanguage(header, i18n) {
  if (!header || !i18n) return i18n?.defaultLocale;
  const candidates = header
    .split(',')
    .map(part => {
      const [tag, ...parameters] = part.trim().split(';');
      // The parameter name is case-insensitive per RFC 9110; `Q=` is valid.
      const quality = parameters
        .map(parameter => parameter.trim())
        .find(parameter => parameter.toLowerCase().startsWith('q='));
      return {
        tag: tag.trim(),
        quality: quality ? Number(quality.slice(2)) : 1,
      };
    })
    // q=0 means "not acceptable", so such a tag must never be chosen.
    .filter(
      candidate =>
        candidate.tag &&
        Number.isFinite(candidate.quality) &&
        candidate.quality > 0,
    )
    .sort((left, right) => right.quality - left.quality);

  const available = new Map(
    i18n.locales.map(locale => [locale.toLowerCase(), locale]),
  );
  for (const { tag } of candidates) {
    const lower = tag.toLowerCase();
    if (lower === '*') return i18n.defaultLocale;
    if (available.has(lower)) return available.get(lower);
    const base = lower.split('-')[0];
    if (available.has(base)) return available.get(base);
    const regional = i18n.locales.find(
      locale => locale.toLowerCase().split('-')[0] === base,
    );
    if (regional) return regional;
  }
  return i18n.defaultLocale;
}

export {
  isBareDefault,
  localizePath,
  matchAcceptLanguage,
  normalizeI18n,
  resolveLocale,
  STRATEGIES,
};
