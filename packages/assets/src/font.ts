import React from 'react';

export interface FontSource {
  src: string;
  format?: string;
  type?: string;
  weight?: string;
  style?: string;
}

export interface FontDefinition {
  className: string;
  css: string;
  family: string;
  links: Array<Record<string, string>>;
  style: { fontFamily: string };
  variable?: string | undefined;
}

export interface LocalFontOptions {
  src: string | FontSource | Array<string | FontSource>;
  family?: string;
  weight?: string;
  style?: string;
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  variable?: string;
  preload?: boolean;
  fallback?: string[];
}

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function normalizeSources(source: LocalFontOptions['src']): FontSource[] {
  return (Array.isArray(source) ? source : [source]).map(item =>
    typeof item === 'string' ? { src: item } : item,
  );
}

function localFont({
  src,
  family,
  weight = '400',
  style = 'normal',
  display = 'swap',
  variable,
  preload = true,
  fallback = [],
}: LocalFontOptions): FontDefinition {
  if (!src) throw new TypeError('localFont requires at least one source file.');
  const sources = normalizeSources(src);
  const id = hash(
    JSON.stringify({ src: sources, family, weight, style }),
  ).slice(0, 8);
  const fontFamily = family || `ness-font-${id}`;
  const declarations = sources
    .map(source => {
      const format = source.format ? ` format('${source.format}')` : '';
      return `@font-face{font-family:'${fontFamily}';src:url('${source.src}')${format};font-weight:${source.weight || weight};font-style:${source.style || style};font-display:${display};}`;
    })
    .join('');
  const className = `ness-font-${id}`;
  const css = `${declarations}.${className}{font-family:'${fontFamily}'${fallback.length ? `,${fallback.join(',')}` : ''};}${variable ? `.${className}{${variable}:'${fontFamily}';}` : ''}`;
  const links = preload
    ? sources.map(source => ({
        rel: 'preload',
        href: source.src,
        as: 'font',
        type:
          source.type ||
          `font/${(source.format || source.src.split('.').pop() || 'woff2').replace('truetype', 'ttf')}`,
        crossOrigin: 'anonymous',
      }))
    : [];
  return {
    className,
    css,
    family: fontFamily,
    links,
    style: { fontFamily: `'${fontFamily}'` },
    variable,
  };
}

export interface GoogleFontOptions {
  /** `'400'`, `['400', '700']`, or a variable range like `'100..900'`. */
  weight?: string | number | Array<string | number>;
  style?: 'normal' | 'italic' | Array<'normal' | 'italic'>;
  /**
   * Accepted for signature compatibility with `next/font/google`. The css2
   * API always serves every subset with `unicode-range` guards, so browsers
   * download only the scripts the page actually uses — there is nothing to
   * narrow here.
   */
  subsets?: string[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  variable?: string;
  fallback?: string[];
  /** Restricts the font to these characters — css2's `text=` parameter. */
  text?: string;
}

/**
 * The application's `basePath`, statically injected by the Vite plugin — the
 * same constant `<Image>` builds its endpoint from.
 */
const FONT_BASE_PATH: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: Record<string, string> }).env?.[
      'NESS_PUBLIC_BASE_PATH'
    ]) ||
  '';

/**
 * The `family=` value css2 expects: `Inter:wght@400;700`, italics as the
 * `ital,wght@0,400;1,400` tuple list, a bare family when nothing was asked.
 */
function googleFamilySpec(
  family: string,
  weight: GoogleFontOptions['weight'],
  style: GoogleFontOptions['style'],
): string {
  const weights = (Array.isArray(weight) ? weight : weight ? [weight] : []).map(
    String,
  );
  const styles = Array.isArray(style) ? style : style ? [style] : [];
  const italic = styles.includes('italic');
  const normal = !styles.length || styles.includes('normal');
  if (!weights.length && !italic) return family;
  const axisWeights = weights.length ? weights : ['400'];
  if (!italic) return `${family}:wght@${axisWeights.join(';')}`;
  const tuples: string[] = [];
  for (const ital of normal ? ['0', '1'] : ['1']) {
    for (const value of axisWeights) tuples.push(`${ital},${value}`);
  }
  return `${family}:ital,wght@${tuples.join(';')}`;
}

/**
 * A Google font, served self-hosted — the reason `next/font/google` exists.
 *
 * The returned stylesheet link points at the application's own
 * `/_ness/font/css2` endpoint, which proxies the css2 API and rewrites every
 * font file URL back through itself. The visitor's browser never connects to
 * Google — no consent-page surprises — and both the CSS and the font bytes
 * are cached in the shared Ness cache, so Google is asked once per build's
 * cache lifetime, not once per visitor.
 *
 * ```tsx
 * const inter = googleFont('Inter', { weight: ['400', '700'] });
 * // <body className={inter.className}>, plus <FontStyles fonts={inter} />
 * ```
 */
function googleFont(
  family: string,
  {
    weight,
    style,
    display = 'swap',
    variable,
    fallback = [],
    text,
  }: GoogleFontOptions = {},
): FontDefinition {
  if (!family) throw new TypeError('googleFont requires a family name.');
  const spec = googleFamilySpec(family, weight, style);
  const query = new URLSearchParams({ family: spec, display });
  if (text) query.set('text', text);
  const id = hash(query.toString()).slice(0, 8);
  const className = `ness-font-${id}`;
  const css = `.${className}{font-family:'${family}'${fallback.length ? `,${fallback.join(',')}` : ''};}${variable ? `.${className}{${variable}:'${family}';}` : ''}`;
  return {
    className,
    css,
    family,
    links: [
      {
        rel: 'stylesheet',
        href: `${FONT_BASE_PATH}/_ness/font/css2?${query}`,
      },
    ],
    style: { fontFamily: `'${family}'` },
    variable,
  };
}

function FontStyles({
  fonts,
}: {
  fonts: FontDefinition | FontDefinition[];
}): React.ReactElement {
  const values = Array.isArray(fonts) ? fonts : [fonts];
  return React.createElement(
    React.Fragment,
    null,
    ...values.flatMap(font => [
      ...font.links.map(link =>
        React.createElement('link', {
          ...link,
          key: `${font.family}:${link['href']}`,
        }),
      ),
      React.createElement('style', {
        key: `${font.family}:css`,
        dangerouslySetInnerHTML: { __html: font.css },
      }),
    ]),
  );
}

export { FontStyles, googleFont, localFont };
