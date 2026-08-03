import React from 'react';

const DEFAULT_WIDTHS = [320, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

function imageUrl(src, width, quality = 75, endpoint = '/_ness/image') {
  const query = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
  });
  return `${endpoint}?${query}`;
}

function Image({
  src,
  alt,
  width,
  height,
  quality = 75,
  sizes,
  priority = false,
  placeholder,
  blurDataURL,
  fill = false,
  unoptimized = false,
  endpoint,
  ...props
}) {
  if (!src) throw new TypeError('Image requires a src property.');
  if (alt === undefined && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[Ness Image] Add descriptive alt text, or pass alt="" for decorative images.',
    );
  }
  const staticImage = typeof src === 'object' ? src : undefined;
  const source = staticImage?.src || src;
  const numericWidth = Number(width || staticImage?.width) || undefined;
  const numericHeight = Number(height || staticImage?.height) || undefined;
  const placeholderSource = blurDataURL || staticImage?.blurDataURL;
  const candidateWidths = numericWidth
    ? [
        ...new Set(
          DEFAULT_WIDTHS.filter(value => value <= numericWidth * 2).concat(
            numericWidth,
            numericWidth * 2,
          ),
        ),
      ].sort((a, b) => a - b)
    : DEFAULT_WIDTHS;
  const optimizedSrc = unoptimized
    ? source
    : imageUrl(source, numericWidth || candidateWidths[4], quality, endpoint);
  const imageProps = {
    ...props,
    src: optimizedSrc,
    alt: alt || '',
    width: fill ? undefined : numericWidth,
    height: fill ? undefined : numericHeight,
    loading: priority ? 'eager' : props.loading || 'lazy',
    decoding: props.decoding || 'async',
    fetchPriority: priority ? 'high' : props.fetchPriority,
    sizes: sizes || (numericWidth ? `${numericWidth}px` : '100vw'),
    srcSet: unoptimized
      ? undefined
      : candidateWidths
          .map(
            value => `${imageUrl(source, value, quality, endpoint)} ${value}w`,
          )
          .join(', '),
    style: {
      ...(fill
        ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
        : {}),
      ...(placeholder === 'blur' && placeholderSource
        ? {
            backgroundImage: `url("${placeholderSource}")`,
            backgroundSize: 'cover',
          }
        : {}),
      ...props.style,
    },
  };
  return React.createElement('img', imageProps);
}

export { DEFAULT_WIDTHS, Image, imageUrl };
