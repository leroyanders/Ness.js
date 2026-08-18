import { createElement, Fragment } from 'react';
import type { ReactNode } from 'react';

/**
 * Tags for a segment's file-based metadata: `icon.png`, `apple-icon.png`,
 * `opengraph-image.png`, `twitter-image.png` next to a page, and the dynamic
 * `opengraph-image.tsx`/`twitter-image.tsx` routes.
 *
 * The hrefs arrive from the generated route wrapper — static files as the
 * hashed asset URLs Vite emitted, dynamic images as their route paths, which
 * may still contain `:param` placeholders the current params fill in.
 */
export interface FileMetadataProps {
  icon?: string[];
  apple?: string[];
  og?: string[];
  twitter?: string[];
  params?: Record<string, string | undefined>;
}

function fill(
  href: string,
  params: Record<string, string | undefined> = {},
): string {
  return href.replace(
    /:([A-Za-z0-9_]+)/g,
    (match, name: string) => params[name] ?? match,
  );
}

function contentTypeOf(href: string): string | undefined {
  const extension = href.split('?')[0]?.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    default:
      return undefined;
  }
}

function FileMetadataTags({
  icon = [],
  apple = [],
  og = [],
  twitter = [],
  params,
}: FileMetadataProps): ReactNode {
  return createElement(
    Fragment,
    null,
    ...icon.map(href => {
      const resolved = fill(href, params);
      return createElement('link', {
        key: `icon:${resolved}`,
        rel: 'icon',
        href: resolved,
        ...(contentTypeOf(resolved)
          ? { type: contentTypeOf(resolved) }
          : {}),
      });
    }),
    ...apple.map(href => {
      const resolved = fill(href, params);
      return createElement('link', {
        key: `apple:${resolved}`,
        rel: 'apple-touch-icon',
        href: resolved,
      });
    }),
    ...og.map(href => {
      const resolved = fill(href, params);
      return createElement('meta', {
        key: `og:${resolved}`,
        property: 'og:image',
        content: resolved,
      });
    }),
    ...twitter.map(href => {
      const resolved = fill(href, params);
      return createElement('meta', {
        key: `tw:${resolved}`,
        name: 'twitter:image',
        content: resolved,
      });
    }),
    og.length || twitter.length
      ? createElement('meta', {
          key: 'tw:card',
          name: 'twitter:card',
          content: 'summary_large_image',
        })
      : null,
  );
}

export { FileMetadataTags };
