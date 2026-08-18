import React from 'react';
import type { CSSProperties, ImgHTMLAttributes } from 'react';

/** A build-time import of an image file, which carries its own dimensions. */
export interface StaticImage {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

/**
 * Builds the URL one rendition of an image is served from. The default
 * loader targets the built-in `/_ness/image` optimizer; a custom one targets
 * whatever CDN actually serves the pixels.
 */
export type ImageLoader = (props: {
  src: string;
  width: number;
  quality?: number;
}) => string;

export interface ImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'width' | 'height'
> {
  src: string | StaticImage;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  unoptimized?: boolean;
  endpoint?: string;
  /** This image's own URL builder; overrides the application-wide loader. */
  loader?: ImageLoader;
}

const DEFAULT_WIDTHS = [320, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

/**
 * The application's `basePath`, statically injected by the Vite plugin. Empty
 * everywhere else — tests, plain Node — where there is no prefix to honour.
 */
const BASE_PATH: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: Record<string, string> }).env?.[
      'NESS_PUBLIC_BASE_PATH'
    ]) ||
  '';

/**
 * The application-wide image loader, when one was configured. Set once —
 * typically in `root.tsx` — and every `<Image>` without its own `loader`
 * prop builds its URLs through it, which is how a project points the whole
 * image pipeline at Cloudinary or imgix without touching each usage.
 */
let globalImageLoader: ImageLoader | undefined;

function setImageLoader(loader: ImageLoader | undefined): void {
  globalImageLoader = loader;
}

function imageUrl(
  src: string,
  width: number,
  quality = 75,
  endpoint = `${BASE_PATH}/_ness/image`,
): string {
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
  loader,
  ...props
}: ImageProps): React.ReactElement {
  if (!src) throw new TypeError('Image requires a src property.');
  if (alt === undefined && process.env['NODE_ENV'] !== 'production') {
    console.warn(
      '[Ness Image] Add descriptive alt text, or pass alt="" for decorative images.',
    );
  }
  const staticImage = typeof src === 'object' ? src : undefined;
  const source = staticImage ? staticImage.src : (src as string);
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
  // Per-image loader, then the application-wide one, then the built-in
  // optimizer endpoint — the most specific statement wins.
  const buildUrl: ImageLoader =
    loader ||
    globalImageLoader ||
    (({ src: value, width: rendition, quality: q }) =>
      imageUrl(value, rendition, q, endpoint));
  const optimizedSrc = unoptimized
    ? source
    : buildUrl({
        src: source,
        // DEFAULT_WIDTHS always has a fifth entry; the filtered list is only
        // ever shorter when an explicit width made the index unnecessary.
        width: numericWidth || candidateWidths[4]!,
        quality,
      });
  const imageProps: ImgHTMLAttributes<HTMLImageElement> = {
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
            value =>
              `${buildUrl({ src: source, width: value, quality })} ${value}w`,
          )
          .join(', '),
    style: {
      ...(fill
        ? ({
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          } as CSSProperties)
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

export { DEFAULT_WIDTHS, Image, imageUrl, setImageLoader };
