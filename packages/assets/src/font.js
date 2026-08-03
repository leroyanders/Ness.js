import React from 'react';

function hash(value) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function normalizeSources(source) {
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
}) {
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

function FontStyles({ fonts }) {
  const values = Array.isArray(fonts) ? fonts : [fonts];
  return React.createElement(
    React.Fragment,
    null,
    ...values.flatMap(font => [
      ...font.links.map(link =>
        React.createElement('link', {
          ...link,
          key: `${font.family}:${link.href}`,
        }),
      ),
      React.createElement('style', {
        key: `${font.family}:css`,
        dangerouslySetInnerHTML: { __html: font.css },
      }),
    ]),
  );
}

export { FontStyles, localFont };
