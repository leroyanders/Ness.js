import { createElement, Fragment, use } from 'react';
import type { ReactNode } from 'react';

/**
 * Route-level metadata, in the object shape `export const metadata` and
 * `generateMetadata` return. The subset of Next's `Metadata` that maps onto
 * real tags — every field here renders something.
 */
export interface Metadata {
  title?: string | { default?: string; template?: string; absolute?: string };
  description?: string;
  applicationName?: string;
  keywords?: string | string[];
  authors?: Array<{ name: string; url?: string }>;
  generator?: string;
  referrer?: string;
  themeColor?: string;
  colorScheme?: string;
  viewport?: string;
  robots?:
    | string
    | { index?: boolean; follow?: boolean; [directive: string]: unknown };
  manifest?: string;
  metadataBase?: string | URL;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
    types?: Record<string, string>;
  };
  icons?:
    | string
    | {
        icon?: string | string[];
        shortcut?: string;
        apple?: string | string[];
      };
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
    locale?: string;
    type?: string;
    images?: string | OpenGraphImage | Array<string | OpenGraphImage>;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    images?: string | string[];
  };
  verification?: {
    google?: string;
    yandex?: string;
    other?: Record<string, string>;
  };
  /** Anything without a dedicated field: rendered as plain meta tags. */
  other?: Record<string, string | number>;
}

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

/** What `generateMetadata` receives. */
export interface GenerateMetadataArgs {
  params: Record<string, string | undefined>;
  /** The route's own loader data, when it has a loader. */
  loaderData?: unknown;
}

export type GenerateMetadata = (
  args: GenerateMetadataArgs,
) => Metadata | Promise<Metadata>;

/**
 * The nearest ancestor's title template, from the chain of layout metadata a
 * generated wrapper threads down as a plain prop.
 *
 * A prop rather than context on purpose: in RSC mode these components render
 * as server components, where context does not exist — and the generated
 * wrapper already knows its ancestor layouts statically, so the information
 * needs no runtime channel at all. Only the nearest template applies, which
 * is also Next's rule: templates do not compose.
 */
function nearestTemplate(
  parents: Array<Metadata | undefined> | undefined,
): string | undefined {
  if (!parents) return undefined;
  for (let index = parents.length - 1; index >= 0; index -= 1) {
    const title = parents[index]?.title;
    if (title && typeof title === 'object' && title.template !== undefined)
      return title.template;
  }
  return undefined;
}

function resolveUrl(
  value: string | undefined,
  base: string | URL | undefined,
): string | undefined {
  if (!value) return value;
  if (!base) return value;
  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
}

function robotsContent(robots: NonNullable<Metadata['robots']>): string {
  if (typeof robots === 'string') return robots;
  const parts: string[] = [];
  if (robots.index !== undefined) parts.push(robots.index ? 'index' : 'noindex');
  if (robots.follow !== undefined)
    parts.push(robots.follow ? 'follow' : 'nofollow');
  for (const [key, value] of Object.entries(robots)) {
    if (key === 'index' || key === 'follow') continue;
    if (value === true) parts.push(key);
    else if (value !== false && value !== undefined)
      parts.push(`${key}:${String(value)}`);
  }
  return parts.join(', ');
}

function meta(name: string, content: string | undefined): ReactNode {
  return content == null
    ? null
    : createElement('meta', { key: `n:${name}:${content}`, name, content });
}

function property(name: string, content: string | undefined): ReactNode {
  return content == null
    ? null
    : createElement('meta', {
        key: `p:${name}:${content}`,
        property: name,
        content,
      });
}

function link(
  rel: string,
  href: string | undefined,
  extra: Record<string, string> = {},
): ReactNode {
  return href == null
    ? null
    : createElement('link', { key: `l:${rel}:${href}`, rel, href, ...extra });
}

/**
 * One metadata object, rendered as the tags it means. React hoists `<title>`,
 * `<meta>` and `<link>` into `<head>` from anywhere in the tree, so this can
 * render exactly where the route does.
 */
function MetadataTags({
  metadata,
  parents,
}: {
  metadata: Metadata;
  /** Ancestor layout metadata, outermost first, for title templates. */
  parents?: Array<Metadata | undefined>;
}): ReactNode {
  const parentTemplate = nearestTemplate(parents);
  const base = metadata.metadataBase;

  // Title resolution: a page's string title flows through the nearest
  // layout's template; `absolute` opts out; a layout's own tag shows its
  // `default` untemplated — the template is a statement about children.
  let title: string | undefined;
  if (typeof metadata.title === 'string') {
    title =
      parentTemplate !== undefined
        ? parentTemplate.replace('%s', metadata.title)
        : metadata.title;
  } else if (metadata.title) {
    title = metadata.title.absolute ?? metadata.title.default;
  }

  const og = metadata.openGraph;
  const ogImages =
    og?.images == null
      ? []
      : (Array.isArray(og.images) ? og.images : [og.images]).map(image =>
          typeof image === 'string' ? { url: image } : image,
        );
  const twitter = metadata.twitter;
  const twitterImages =
    twitter?.images == null
      ? []
      : Array.isArray(twitter.images)
        ? twitter.images
        : [twitter.images];
  const icons =
    typeof metadata.icons === 'string'
      ? { icon: [metadata.icons] }
      : metadata.icons
        ? {
            icon:
              metadata.icons.icon == null
                ? []
                : [metadata.icons.icon].flat(),
            shortcut: metadata.icons.shortcut,
            apple:
              metadata.icons.apple == null ? [] : [metadata.icons.apple].flat(),
          }
        : undefined;

  const tags = createElement(
    Fragment,
    null,
    title == null ? null : createElement('title', { key: 'title' }, title),
    meta('description', metadata.description),
    meta('application-name', metadata.applicationName),
    meta(
      'keywords',
      Array.isArray(metadata.keywords)
        ? metadata.keywords.join(', ')
        : metadata.keywords,
    ),
    ...(metadata.authors ?? []).map(author =>
      createElement(
        Fragment,
        { key: `author:${author.name}` },
        meta('author', author.name),
        link('author', author.url),
      ),
    ),
    meta('generator', metadata.generator),
    meta('referrer', metadata.referrer),
    meta('theme-color', metadata.themeColor),
    meta('color-scheme', metadata.colorScheme),
    meta('viewport', metadata.viewport),
    metadata.robots == null
      ? null
      : meta('robots', robotsContent(metadata.robots)),
    link('manifest', metadata.manifest),
    link('canonical', resolveUrl(metadata.alternates?.canonical, base)),
    ...Object.entries(metadata.alternates?.languages ?? {}).map(
      ([hreflang, href]) =>
        createElement('link', {
          key: `alt:${hreflang}`,
          rel: 'alternate',
          hrefLang: hreflang,
          href: resolveUrl(href, base),
        }),
    ),
    ...Object.entries(metadata.alternates?.types ?? {}).map(([type, href]) =>
      createElement('link', {
        key: `alt-type:${type}`,
        rel: 'alternate',
        type,
        href: resolveUrl(href, base),
      }),
    ),
    ...(icons?.icon ?? []).map(href => link('icon', href)),
    icons?.shortcut ? link('shortcut icon', icons.shortcut) : null,
    ...(icons?.apple ?? []).map(href => link('apple-touch-icon', href)),
    // Open Graph falls back to the page's own title and description: the
    // common case is one statement, not two.
    property('og:title', og?.title ?? title),
    property('og:description', og?.description ?? metadata.description),
    property('og:url', resolveUrl(og?.url, base)),
    property('og:site_name', og?.siteName),
    property('og:locale', og?.locale),
    property('og:type', og?.type),
    ...ogImages.map(image =>
      createElement(
        Fragment,
        { key: `og:image:${image.url}` },
        property('og:image', resolveUrl(image.url, base)),
        image.width == null
          ? null
          : property('og:image:width', String(image.width)),
        image.height == null
          ? null
          : property('og:image:height', String(image.height)),
        image.alt == null ? null : property('og:image:alt', image.alt),
      ),
    ),
    meta(
      'twitter:card',
      twitter?.card ??
        (ogImages.length || twitterImages.length
          ? 'summary_large_image'
          : undefined),
    ),
    meta('twitter:site', twitter?.site),
    meta('twitter:creator', twitter?.creator),
    meta('twitter:title', twitter?.title),
    meta('twitter:description', twitter?.description),
    ...twitterImages.map(image =>
      meta('twitter:image', resolveUrl(image, base)),
    ),
    meta('google-site-verification', metadata.verification?.google),
    meta('yandex-verification', metadata.verification?.yandex),
    ...Object.entries(metadata.verification?.other ?? {}).map(([name, value]) =>
      meta(name, value),
    ),
    ...Object.entries(metadata.other ?? {}).map(([name, value]) =>
      meta(name, String(value)),
    ),
  );

  return tags;
}

/**
 * `use()` retries a suspended component from scratch, so the promise handed to
 * it must be the same instance on every attempt — a `generateMetadata` called
 * again per attempt would suspend forever. Cached per function, per params,
 * and invalidated when the loader data identity changes (a revalidation is a
 * new answer and deserves fresh metadata).
 */
const generated = new WeakMap<
  GenerateMetadata,
  Map<string, { input: unknown; produced: Metadata | Promise<Metadata> }>
>();

function produceMetadata(
  metadata: GenerateMetadata,
  args: GenerateMetadataArgs,
): Metadata | Promise<Metadata> {
  const key = JSON.stringify(args.params ?? {});
  let byParams = generated.get(metadata);
  if (!byParams) {
    byParams = new Map();
    generated.set(metadata, byParams);
  }
  const cached = byParams.get(key);
  if (cached && cached.input === args.loaderData) return cached.produced;
  const produced = metadata(args);
  byParams.set(key, { input: args.loaderData, produced });
  return produced;
}

/**
 * Renders the tags for a route's `metadata` or `generateMetadata` export.
 * Static objects render directly; a function is called with the route's
 * params and loader data, and a returned promise suspends via `use()` — under
 * streaming SSR the tags flush with the boundary they are in.
 */
function RouteMetadata({
  metadata,
  args,
  parents,
}: {
  metadata: Metadata | GenerateMetadata | undefined;
  args?: GenerateMetadataArgs;
  parents?: Array<Metadata | undefined>;
}): ReactNode {
  if (!metadata) return null;
  let resolved: Metadata;
  if (typeof metadata === 'function') {
    const produced = produceMetadata(metadata, args ?? { params: {} });
    resolved =
      produced && typeof (produced as Promise<Metadata>).then === 'function'
        ? use(produced as Promise<Metadata>)
        : (produced as Metadata);
  } else {
    resolved = metadata;
  }
  return createElement(MetadataTags, { metadata: resolved, parents });
}

export { MetadataTags, RouteMetadata };
