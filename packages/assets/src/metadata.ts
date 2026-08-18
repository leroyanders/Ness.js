import '@nessframework/server/web-api';

export interface TitleMetadata {
  default?: string;
  template?: string;
  absolute?: string;
}

export interface OpenGraphImage {
  url: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
}

export interface OpenGraphMetadata {
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  siteName?: string;
  locale?: string;
  images?: Array<string | OpenGraphImage>;
  [key: string]: unknown;
}

export interface TwitterMetadata {
  card?: string;
  title?: string;
  description?: string;
  site?: string;
  creator?: string;
  images?: Array<string | { url: string }>;
  [key: string]: unknown;
}

export interface NessMetadata {
  title?: string | TitleMetadata;
  description?: string;
  applicationName?: string;
  generator?: string;
  keywords?: string | string[];
  themeColor?: string;
  colorScheme?: string;
  authors?: Array<string | { name: string }>;
  robots?: string | Record<string, boolean>;
  alternates?: { canonical?: string; languages?: Record<string, string> };
  openGraph?: OpenGraphMetadata;
  twitter?: TwitterMetadata;
  [key: string]: unknown;
}

export type MetaDescriptor = Record<string, string>;

export interface RobotsRule {
  userAgent?: string;
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
}

export interface RobotsOptions {
  rules?: RobotsRule | RobotsRule[];
  sitemap?: string;
  host?: string;
}

export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: string;
  priority?: number | string;
}

function compact(object: Record<string, unknown>): MetaDescriptor {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  ) as MetaDescriptor;
}

function mergeMetadata(
  parent: NessMetadata = {},
  child: NessMetadata = {},
): NessMetadata {
  let title = child.title ?? parent.title;
  if (
    typeof child.title === 'string' &&
    typeof parent.title === 'object' &&
    parent.title?.template
  ) {
    title = parent.title.template.replace('%s', child.title);
  }
  return {
    ...parent,
    ...child,
    title,
    alternates: { ...(parent.alternates || {}), ...(child.alternates || {}) },
    openGraph: { ...(parent.openGraph || {}), ...(child.openGraph || {}) },
    robots:
      typeof child.robots === 'object'
        ? {
            ...(typeof parent.robots === 'object' ? parent.robots : {}),
            ...child.robots,
          }
        : (child.robots ?? parent.robots),
    twitter: { ...(parent.twitter || {}), ...(child.twitter || {}) },
  };
}

function resolveTitle(title: NessMetadata['title']): string | undefined {
  if (!title || typeof title === 'string') return title;
  return title.absolute || title.default;
}

function contentDescriptor(name: string, content: unknown): MetaDescriptor[] {
  return content === undefined || content === null
    ? []
    : [{ name, content: String(content) }];
}

function propertyDescriptor(
  property: string,
  content: unknown,
): MetaDescriptor[] {
  return content === undefined || content === null
    ? []
    : [{ property, content: String(content) }];
}

function robotsContent(robots: NessMetadata['robots']): string | undefined {
  if (typeof robots === 'string') return robots;
  if (!robots) return undefined;
  return Object.entries(robots)
    .filter(([, enabled]) => typeof enabled === 'boolean')
    .map(([directive, enabled]) => (enabled ? directive : `no${directive}`))
    .join(', ');
}

function metadataToDescriptors(metadata: NessMetadata = {}): MetaDescriptor[] {
  const descriptors: MetaDescriptor[] = [];
  const title = resolveTitle(metadata.title);
  if (title) descriptors.push({ title: String(title) });
  descriptors.push(
    ...contentDescriptor('description', metadata.description),
    ...contentDescriptor('application-name', metadata.applicationName),
    ...contentDescriptor('generator', metadata.generator),
    ...contentDescriptor(
      'keywords',
      Array.isArray(metadata.keywords)
        ? metadata.keywords.join(', ')
        : metadata.keywords,
    ),
    ...contentDescriptor('robots', robotsContent(metadata.robots)),
    ...contentDescriptor('theme-color', metadata.themeColor),
    ...contentDescriptor('color-scheme', metadata.colorScheme),
  );

  for (const author of metadata.authors || []) {
    if (typeof author === 'string')
      descriptors.push({ name: 'author', content: author });
    else if (author && author.name)
      descriptors.push(compact({ name: 'author', content: author.name }));
  }

  if (metadata.alternates?.canonical)
    descriptors.push({
      tagName: 'link',
      rel: 'canonical',
      href: metadata.alternates.canonical,
    });
  for (const [language, href] of Object.entries(
    metadata.alternates?.languages || {},
  )) {
    descriptors.push({
      tagName: 'link',
      rel: 'alternate',
      hrefLang: language,
      href,
    });
  }

  const openGraph: OpenGraphMetadata = metadata.openGraph || {};
  descriptors.push(
    ...propertyDescriptor('og:title', openGraph.title || title),
    ...propertyDescriptor(
      'og:description',
      openGraph.description || metadata.description,
    ),
    ...propertyDescriptor('og:type', openGraph.type),
    ...propertyDescriptor('og:url', openGraph.url),
    ...propertyDescriptor('og:site_name', openGraph.siteName),
    ...propertyDescriptor('og:locale', openGraph.locale),
  );
  for (const image of openGraph.images || []) {
    const normalized: OpenGraphImage | undefined =
      typeof image === 'string' ? { url: image } : image;
    if (!normalized?.url) continue;
    descriptors.push({ property: 'og:image', content: normalized.url });
    descriptors.push(...propertyDescriptor('og:image:width', normalized.width));
    descriptors.push(
      ...propertyDescriptor('og:image:height', normalized.height),
    );
    descriptors.push(...propertyDescriptor('og:image:alt', normalized.alt));
  }

  const twitter: TwitterMetadata = metadata.twitter || {};
  descriptors.push(
    ...contentDescriptor('twitter:card', twitter.card),
    ...contentDescriptor(
      'twitter:title',
      twitter.title || openGraph.title || title,
    ),
    ...contentDescriptor(
      'twitter:description',
      twitter.description || openGraph.description || metadata.description,
    ),
    ...contentDescriptor('twitter:site', twitter.site),
    ...contentDescriptor('twitter:creator', twitter.creator),
  );
  for (const image of twitter.images || []) {
    descriptors.push({
      name: 'twitter:image',
      content: typeof image === 'string' ? image : image.url,
    });
  }

  return descriptors.filter(
    descriptor =>
      descriptor['content'] !== undefined ||
      descriptor['title'] ||
      descriptor['tagName'],
  );
}

function defineMetadata(metadata: NessMetadata): MetaDescriptor[] {
  return metadataToDescriptors(metadata);
}

function createManifest(manifest: Record<string, unknown>): Response {
  return Response.json(manifest, {
    headers: {
      'cache-control': 'public, max-age=3600',
      'content-type': 'application/manifest+json',
    },
  });
}

function createRobots({
  rules = [{ userAgent: '*', allow: '/' }],
  sitemap,
  host,
}: RobotsOptions = {}): Response {
  const normalized = Array.isArray(rules) ? rules : [rules];
  const lines = normalized.flatMap(rule => [
    `User-agent: ${rule.userAgent || '*'}`,
    ...(Array.isArray(rule.allow) ? rule.allow : [rule.allow])
      .filter(Boolean)
      .map(value => `Allow: ${value}`),
    ...(Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow])
      .filter(Boolean)
      .map(value => `Disallow: ${value}`),
    ...(rule.crawlDelay ? [`Crawl-delay: ${rule.crawlDelay}`] : []),
    '',
  ]);
  if (sitemap) lines.push(`Sitemap: ${sitemap}`);
  if (host) lines.push(`Host: ${host}`);
  return new Response(`${lines.join('\n').trim()}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

const XML_ESCAPES: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
};

function escapeXml(value: unknown): string {
  return String(value).replace(
    /[<>&'"]/g,
    character => XML_ESCAPES[character]!,
  );
}

function createSitemap(entries: Array<string | SitemapEntry>): Response {
  const urls = entries.map(entry => {
    const item: SitemapEntry =
      typeof entry === 'string' ? { url: entry } : entry;
    return [
      '<url>',
      `<loc>${escapeXml(item.url)}</loc>`,
      item.lastModified
        ? `<lastmod>${escapeXml(item.lastModified instanceof Date ? item.lastModified.toISOString() : item.lastModified)}</lastmod>`
        : '',
      item.changeFrequency
        ? `<changefreq>${escapeXml(item.changeFrequency)}</changefreq>`
        : '',
      item.priority !== undefined
        ? `<priority>${escapeXml(item.priority)}</priority>`
        : '',
      '</url>',
    ]
      .filter(Boolean)
      .join('');
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}

export {
  createManifest,
  createRobots,
  createSitemap,
  defineMetadata,
  mergeMetadata,
  metadataToDescriptors,
};
