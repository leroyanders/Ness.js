import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isBareDefault, normalizeI18n } from './i18n.js';
import type { I18nConfig, NormalizedI18nConfig } from './i18n.js';

const ROUTE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
const RESERVED_FILES = [
  'layout',
  'page',
  'route',
  'error',
  'loading',
  'template',
  'middleware',
  'not-found',
  'forbidden',
  'unauthorized',
  'sitemap',
  'robots',
  'manifest',
  'default',
  'global-error',
  'opengraph-image',
  'twitter-image',
];

/** What a segment declares about itself, read statically. */
export interface SegmentConfig {
  revalidate?: number | false;
  dynamic?: 'force-dynamic' | 'force-static' | 'auto';
  runtime?: 'node' | 'edge' | 'serverless';
  maxDuration?: number;
  dynamicParams?: boolean;
  fetchCache?: 'default-cache' | 'default-no-store';
  preferredRegion?: string | string[];
  ppr?: boolean;
}

/** What the prefetch layer needs to know about a page, decided statically. */
export interface PagePrefetchInfo {
  /** Whether the page's data comes from a server `loader`. */
  serverLoader: boolean;
  /** Whether the generated wrapper owns the page's `clientLoader`. */
  wrapped: boolean;
}

/** A node of the generated route tree, shaped as React Router expects. */
export interface NessRoute {
  id: string;
  file?: string;
  path?: string;
  index?: boolean;
  children?: NessRoute[];
  config?: SegmentConfig;
  prefetch?: PagePrefetchInfo;
  /** The module declaring `generateStaticParams`, when the page has one. */
  staticParams?: string;
  /** The HTTP methods a `route.ts` resource exports, read off its source. */
  methods?: string[];
}

/** One navigable page, as a full path pattern. */
export interface NessRoutePath {
  id: string;
  path: string;
  file: string;
  config?: SegmentConfig;
  prefetch?: PagePrefetchInfo;
  /** The module declaring `generateStaticParams`, when the page has one. */
  staticParams?: string;
}

export interface NessRoutesOptions {
  appDirectory?: string;
  routesDirectory?: string;
  generatedDirectory?: string;
  /** Mounts the route tree under a locale segment. */
  i18n?: I18nConfig | NormalizedI18nConfig;
  /**
   * The application-wide `clientCache` default, in seconds. Normally read off
   * `ness.config.*` beside the app directory; passing it explicitly overrides
   * that lookup.
   */
  clientCache?: number;
  /**
   * Minimum time a shown `loading.tsx` stays on screen, in milliseconds.
   * Normally read off `ness.config.*` beside the app directory; passing it
   * explicitly overrides that lookup.
   */
  minimumLoadingMs?: number;
}

/**
 * The metadata files a segment can declare, and the URL each is published at.
 *
 * A file exporting a default function; the framework serializes what it
 * returns. Same convention as Next, and for the same reason: a sitemap is a
 * route, but writing it as one means hand-rolling the XML and remembering the
 * content type, every project, every time.
 */
const METADATA_FILES = [
  { basename: 'sitemap', path: 'sitemap.xml', serializer: 'createSitemap' },
  { basename: 'robots', path: 'robots.txt', serializer: 'createRobots' },
  {
    basename: 'manifest',
    path: 'manifest.webmanifest',
    serializer: 'createManifest',
  },
];

/**
 * Route-module exports that configure the segment rather than render it.
 * Recorded in the build manifest so the production server can read a page's
 * caching rules without importing the page.
 */
const SEGMENT_CONFIG = [
  'revalidate',
  'dynamic',
  'runtime',
  'maxDuration',
  'dynamicParams',
  'fetchCache',
  'preferredRegion',
  'ppr',
];

function slash(value: string): string {
  return value.split(path.sep).join('/');
}

/**
 * Config filenames, most preferred first — the same list the Vite plugin
 * resolves, kept in the same order so both read the same file.
 */
const CONFIG_FILES = ['ness.config.ts', 'ness.config.mjs', 'ness.config.js'];

/** The application-wide route-generation defaults `ness.config.*` carries. */
interface ConfigDefaults {
  /** `clientCache`, in seconds. */
  clientCache: number;
  /** `minimumLoadingMs`, in milliseconds. */
  minimumLoadingMs: number;
}

const NO_CONFIG_DEFAULTS: ConfigDefaults = {
  clientCache: 0,
  minimumLoadingMs: 0,
};

/** Keyed file + mtime, so an edited config is re-read, not served stale. */
const configDefaultsReads = new Map<string, Promise<ConfigDefaults>>();

/**
 * The application-wide defaults route generation bakes into the wrappers —
 * `clientCache`, `minimumLoadingMs` — read off `ness.config.*` in the
 * project root.
 *
 * Read here, in route generation, rather than threaded through options,
 * because `nessRoutes` runs from several places — the application's own
 * `app/routes.ts`, the Vite plugin's watcher, the manifest writer — and they
 * regenerate the same files: two callers resolving the option differently
 * would rewrite the wrappers back and forth forever. One source, every
 * caller. Absent file, unreadable file, absent field: all mean `0`.
 */
function readConfigDefaults(root: string): Promise<ConfigDefaults> {
  const file = CONFIG_FILES.map(name => path.join(root, name)).find(
    fs.existsSync,
  );
  if (!file) return Promise.resolve(NO_CONFIG_DEFAULTS);
  let key: string;
  try {
    key = `${file}:${fs.statSync(file).mtimeMs}`;
  } catch {
    return Promise.resolve(NO_CONFIG_DEFAULTS);
  }
  let read = configDefaultsReads.get(key);
  if (!read) {
    const numberOrZero = (value: unknown): number =>
      typeof value === 'number' && Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
    read = import(
      `${pathToFileURL(file).href}?mtime=${encodeURIComponent(key)}`
    ).then(
      imported => {
        const module = imported as {
          default?: { ness?: { router?: Record<string, unknown> } };
          ness?: { router?: Record<string, unknown> };
        };
        const config = module.default || module;
        const router = config?.ness?.router;
        return {
          clientCache: numberOrZero(router?.clientCache),
          minimumLoadingMs: numberOrZero(router?.minimumLoadingMs),
        };
      },
      () => NO_CONFIG_DEFAULTS,
    );
    configDefaultsReads.set(key, read);
  }
  return read;
}

function findModule(directory: string, basename: string): string | undefined {
  for (const extension of ROUTE_EXTENSIONS) {
    const filename = path.join(directory, `${basename}${extension}`);
    if (fs.existsSync(filename)) return filename;
  }
  return undefined;
}

function segmentPath(segment: string): string | undefined {
  if (/^\(.+\)$/.test(segment) || segment.startsWith('_')) return undefined;
  const optionalCatchAll = segment.match(/^\[\[\.\.\.(.+)\]\]$/);
  if (optionalCatchAll) return '*';
  const catchAll = segment.match(/^\[\.\.\.(.+)\]$/);
  if (catchAll) return '*';
  const dynamic = segment.match(/^\[(.+)\]$/);
  if (dynamic) return `:${dynamic[1]}`;
  return segment;
}

function importPath(from: string, to: string): string {
  let relative = slash(path.relative(path.dirname(from), to));
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
}

/**
 * Every file this pass generated. A route directory that goes away leaves its
 * wrapper behind otherwise — dead on the router, but not dead to the dev
 * server, which keeps trying to reload a module whose imports no longer
 * resolve and fills the console with 404s for a route nobody has any more.
 */
let generatedThisPass: Set<string> | null = null;

function writeIfChanged(filename: string, content: string): void {
  generatedThisPass?.add(path.resolve(filename));
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  if (fs.existsSync(filename) && fs.readFileSync(filename, 'utf8') === content)
    return;
  fs.writeFileSync(filename, content);
}

/** Removes wrappers left over from routes that no longer exist. */
function pruneGenerated(
  generatedDirectory: string,
  written: Set<string>,
): void {
  if (!fs.existsSync(generatedDirectory)) return;
  for (const entry of fs.readdirSync(generatedDirectory, {
    withFileTypes: true,
  })) {
    if (!entry.isFile()) continue;
    const filename = path.resolve(generatedDirectory, entry.name);
    if (written.has(filename)) continue;
    if (!ROUTE_EXTENSIONS.some(extension => filename.endsWith(extension)))
      continue;
    fs.rmSync(filename, { force: true });
  }
}

/** A `.server` sibling: which route exports it owns, and how to import it. */
interface AdjacentServer {
  exports: string[];
  module?: string;
}

function findAdjacentServer(
  generatedFile: string,
  sourceFile: string,
): AdjacentServer {
  const extension = path.extname(sourceFile);
  const base = sourceFile.slice(0, -extension.length);
  const serverFile = ROUTE_EXTENSIONS.map(
    candidate => `${base}.server${candidate}`,
  ).find(fs.existsSync);
  if (!serverFile) return { exports: [] };
  const source = fs.readFileSync(serverFile, 'utf8');
  const exports = ['loader', 'action', 'headers', 'shouldRevalidate'].filter(
    name =>
      new RegExp(
        `\\bexport\\s+(?:async\\s+)?(?:function|const|let|var)\\s+${name}\\b`,
      ).test(source),
  );
  return {
    exports,
    module: JSON.stringify(importPath(generatedFile, serverFile)),
  };
}

/**
 * The image and icon files a segment can declare by name, Next-style:
 * `icon.png`, `apple-icon.png`, `opengraph-image.png`, `twitter-image.png`
 * beside a page. Static files become hashed Vite assets referenced by tags;
 * `opengraph-image.tsx`/`twitter-image.tsx` become resource routes.
 */
const STATIC_METADATA_FILES: Record<string, string[]> = {
  icon: ['.ico', '.png', '.svg', '.jpg', '.jpeg'],
  'apple-icon': ['.png', '.jpg', '.jpeg'],
  'opengraph-image': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'twitter-image': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
};

/** What one directory declared through files rather than exports. */
interface FileMetadata {
  icon: string[];
  apple: string[];
  ogStatic: string[];
  twitterStatic: string[];
  /** A module default-exporting an ImageResponse producer. */
  ogModule?: string | undefined;
  twitterModule?: string | undefined;
}

function findStatic(directory: string, basename: string): string[] {
  const found: string[] = [];
  for (const extension of STATIC_METADATA_FILES[basename] ?? []) {
    const filename = path.join(directory, `${basename}${extension}`);
    if (fs.existsSync(filename)) found.push(filename);
  }
  return found;
}

function findFileMetadata(directory: string): FileMetadata | undefined {
  const metadata: FileMetadata = {
    icon: findStatic(directory, 'icon'),
    apple: findStatic(directory, 'apple-icon'),
    ogStatic: findStatic(directory, 'opengraph-image'),
    twitterStatic: findStatic(directory, 'twitter-image'),
    ogModule: findModule(directory, 'opengraph-image'),
    twitterModule: findModule(directory, 'twitter-image'),
  };
  const declared =
    metadata.icon.length ||
    metadata.apple.length ||
    metadata.ogStatic.length ||
    metadata.twitterStatic.length ||
    metadata.ogModule ||
    metadata.twitterModule;
  return declared ? metadata : undefined;
}

/**
 * Whether a module exports `metadata` or `generateMetadata`, read off the
 * text the same way segment config is.
 */
function metadataExports(source: string): {
  metadata: boolean;
  generateMetadata: boolean;
} {
  return {
    metadata:
      /\bexport\s+(?:const|let|var)\s+metadata\b/.test(source) ||
      /\bexport\s*\{[^}]*\bmetadata\b[^}]*\}/.test(source),
    generateMetadata:
      /\bexport\s+(?:async\s+)?function\s+generateMetadata\b/.test(source) ||
      /\bexport\s+(?:const|let|var)\s+generateMetadata\b/.test(source),
  };
}

/**
 * Whether a middleware file declares `export const config = { matcher }` —
 * Next's declarative scope. Read statically, like everything else routing
 * decides before it can run the module; the generated wrapper imports the
 * real object and hands it to `matchedMiddleware` at runtime.
 */
function middlewareHasConfig(middlewareFile: string): boolean {
  const source = fs.readFileSync(middlewareFile, 'utf8');
  return /\bexport\s+(?:const|let|var)\s+config\b/.test(source);
}

/** The generated lines that publish a segment middleware, matcher included. */
function middlewareLines(
  generatedFile: string,
  middlewareFile: string,
): string[] {
  const modulePath = JSON.stringify(importPath(generatedFile, middlewareFile));
  if (!middlewareHasConfig(middlewareFile)) {
    return [
      `import NessMiddleware from ${modulePath};`,
      'export const middleware = Array.isArray(NessMiddleware) ? NessMiddleware : [NessMiddleware];',
    ];
  }
  return [
    `import NessMiddleware, {config as NessMiddlewareConfig} from ${modulePath};`,
    "import {matchedMiddleware as nessMatchedMiddleware} from '@nessframework/core/client';",
    'export const middleware = nessMatchedMiddleware(NessMiddleware, NessMiddlewareConfig);',
  ];
}

/**
 * Whether a module exports `viewport` or `generateViewport`, read off the
 * text the same way `metadataExports` is.
 */
function viewportExports(source: string): {
  viewport: boolean;
  generateViewport: boolean;
} {
  return {
    viewport:
      /\bexport\s+(?:const|let|var)\s+viewport\b/.test(source) ||
      /\bexport\s*\{[^}]*\bviewport\b[^}]*\}/.test(source),
    generateViewport:
      /\bexport\s+(?:async\s+)?function\s+generateViewport\b/.test(source) ||
      /\bexport\s+(?:const|let|var)\s+generateViewport\b/.test(source),
  };
}

/**
 * One intercepting route: navigating client-side to a URL matching `pattern`
 * from a page under `from` renders `file` in an overlay instead of the real
 * route. A hard load of the same URL never sees this table.
 */
export interface InterceptorEntry {
  from: string;
  pattern: string;
  file: string;
}

/**
 * Filled during a discovery pass and read back by `nessInterceptors()` —
 * same lifecycle as the generated wrappers themselves.
 */
let collectedInterceptors: InterceptorEntry[] = [];

/** `(.)photo`, `(..)photo`, `(..)(..)photo`, `(...)photo` — or nothing. */
const INTERCEPTOR_PREFIX = /^((?:\(\.{1,3}\))+)(.*)$/;

/**
 * Resolves an interceptor directory name against the URL path of the segment
 * it sits in. `(.)` intercepts a sibling, each `(..)` climbs one segment,
 * `(...)` starts over at the root — the same arithmetic as a relative path.
 */
function resolveInterceptorBase(
  name: string,
  urlPath: string,
): { targetBase: string; rest: string } | undefined {
  const match = name.match(INTERCEPTOR_PREFIX);
  if (!match) return undefined;
  const markers = match[1]!.match(/\(\.{1,3}\)/g) ?? [];
  let segments = urlPath.split('/').filter(Boolean);
  for (const marker of markers) {
    if (marker === '(...)') segments = [];
    else if (marker === '(..)') segments = segments.slice(0, -1);
    // '(.)' keeps the current level.
  }
  return { targetBase: segments.join('/'), rest: match[2] ?? '' };
}

/**
 * Walks an interceptor directory for pages and records the URL each one
 * intercepts. Only pages: an interceptor exists to be rendered over the
 * current screen, and only a page is a screen.
 */
function collectInterceptors(
  directory: string,
  name: string,
  urlPath: string,
): void {
  const resolved = resolveInterceptorBase(name, urlPath);
  if (!resolved) return;
  const firstSegment = resolved.rest ? segmentPath(resolved.rest) : undefined;
  const start = [resolved.targetBase, firstSegment]
    .filter(value => value !== undefined && value !== '')
    .join('/');
  const walk = (current: string, targetPath: string): void => {
    const pageFile = findModule(current, 'page');
    if (pageFile) {
      collectedInterceptors.push({
        from: `/${urlPath}`.replace(/\/+$/, '') || '/',
        pattern: `/${targetPath}`.replace(/\/{2,}/g, '/'),
        file: pageFile,
      });
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const segment = segmentPath(entry.name);
      walk(
        path.join(current, entry.name),
        segment === undefined ? targetPath : `${targetPath}/${segment}`,
      );
    }
  };
  walk(directory, start);
}

/**
 * Reads a segment's caching rules off its source: `export const revalidate =
 * 60`, `export const dynamic = 'force-dynamic'`.
 *
 * Statically, from the text, because the answer is needed where the module
 * cannot be run — at build time to write the manifest, and in a production
 * server that must decide whether a URL may be cached before it renders it.
 * A value that is not a literal is not configuration; it is ignored, exactly
 * as Next ignores one it cannot see.
 */
function findSegmentConfig(source: string): SegmentConfig | undefined {
  const config: SegmentConfig = {};
  const revalidate = source.match(
    /\bexport\s+const\s+revalidate\s*(?::[^=]+)?=\s*(\d+|false)\b/,
  );
  if (revalidate)
    config.revalidate =
      revalidate[1] === 'false' ? false : Number(revalidate[1]);
  const dynamic = source.match(
    /\bexport\s+const\s+dynamic\s*(?::[^=]+)?=\s*['"`](force-dynamic|force-static|auto)['"`]/,
  );
  if (dynamic) config.dynamic = dynamic[1] as SegmentConfig['dynamic'];
  const runtime = source.match(
    /\bexport\s+const\s+runtime\s*(?::[^=]+)?=\s*['"`](nodejs|node|edge|serverless)['"`]/,
  );
  if (runtime)
    config.runtime = (runtime[1] === 'nodejs' ? 'node' : runtime[1]) as
      'node' | 'edge' | 'serverless';
  const maxDuration = source.match(
    /\bexport\s+const\s+maxDuration\s*(?::[^=]+)?=\s*(\d+(?:\.\d+)?)\b/,
  );
  if (maxDuration) config.maxDuration = Number(maxDuration[1]);
  const dynamicParams = source.match(
    /\bexport\s+const\s+dynamicParams\s*(?::[^=]+)?=\s*(true|false)\b/,
  );
  if (dynamicParams) config.dynamicParams = dynamicParams[1] === 'true';
  const fetchCache = source.match(
    /\bexport\s+const\s+fetchCache\s*(?::[^=]+)?=\s*['"`](default-cache|default-no-store)['"`]/,
  );
  if (fetchCache)
    config.fetchCache = fetchCache[1] as SegmentConfig['fetchCache'];
  const preferredRegion = source.match(
    /\bexport\s+const\s+preferredRegion\s*(?::[^=]+)?=\s*['"`]([^'"`]+)['"`]/,
  );
  if (preferredRegion) config.preferredRegion = preferredRegion[1];
  // Both spellings: the experimental name Next code arrives with, and the
  // name it will keep here.
  const ppr = source.match(
    /\bexport\s+const\s+(?:experimental_ppr|ppr)\s*(?::[^=]+)?=\s*(true|false)\b/,
  );
  if (ppr) config.ppr = ppr[1] === 'true';
  return Object.keys(config).length ? config : undefined;
}

function findNamedExports(source: string): string[] {
  const names = new Set<string>();
  for (const match of source.matchAll(
    /\bexport\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    names.add(match[1]!);
  }
  for (const match of source.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
    for (const declaration of match[1]!.split(',')) {
      const parts = declaration.trim().split(/\s+as\s+/);
      const name = parts.at(-1)?.trim();
      if (name && name !== 'default' && /^[A-Za-z_$][\w$]*$/.test(name))
        names.add(name);
    }
  }
  return [...names];
}

interface BoundaryFiles {
  errorFile?: string | undefined;
  notFoundFile?: string | undefined;
  forbiddenFile?: string | undefined;
  unauthorizedFile?: string | undefined;
}

function appendBoundary(
  lines: string[],
  generatedFile: string,
  { errorFile, notFoundFile, forbiddenFile, unauthorizedFile }: BoundaryFiles,
): void {
  const statusBoundaries = [
    notFoundFile,
    forbiddenFile,
    unauthorizedFile,
  ].filter(Boolean);
  if (!statusBoundaries.length) {
    if (errorFile)
      lines.push(
        `export {default as ErrorBoundary} from ${JSON.stringify(importPath(generatedFile, errorFile))};`,
      );
    return;
  }
  lines.push(
    "import {isRouteErrorResponse, useRouteError} from 'react-router';",
  );
  if (errorFile)
    lines.push(
      `import NessErrorBoundary from ${JSON.stringify(importPath(generatedFile, errorFile))};`,
    );
  if (notFoundFile)
    lines.push(
      `import NessNotFound from ${JSON.stringify(importPath(generatedFile, notFoundFile))};`,
    );
  if (forbiddenFile)
    lines.push(
      `import NessForbidden from ${JSON.stringify(importPath(generatedFile, forbiddenFile))};`,
    );
  if (unauthorizedFile)
    lines.push(
      `import NessUnauthorized from ${JSON.stringify(importPath(generatedFile, unauthorizedFile))};`,
    );
  lines.push('export function ErrorBoundary(){');
  lines.push('  const error = useRouteError();');
  if (notFoundFile)
    lines.push(
      '  if (isRouteErrorResponse(error) && error.status === 404) return <NessNotFound />;',
    );
  if (forbiddenFile)
    lines.push(
      '  if (isRouteErrorResponse(error) && error.status === 403) return <NessForbidden />;',
    );
  if (unauthorizedFile)
    lines.push(
      '  if (isRouteErrorResponse(error) && error.status === 401) return <NessUnauthorized />;',
    );
  if (errorFile) lines.push('  return <NessErrorBoundary />;');
  else lines.push('  throw error;');
  lines.push('}');
}

interface StreamedRouteOptions {
  generatedFile: string;
  modulePath: string;
  boundaryFile: string;
  routeId: string | undefined;
  namedExports: string[];
  server: AdjacentServer;
  /** The application-wide `clientCache` default, baked into the wrapper. */
  defaultSeconds: number;
  /** The application-wide `minimumLoadingMs`, baked into the wrapper. */
  minimumMs: number;
}

/**
 * The `shouldRevalidate` a wrapper should defer to: the route's own, its
 * `.server` sibling's, or none.
 */
function userShouldRevalidateExpression(
  namedExports: string[],
  server: AdjacentServer,
): string {
  return namedExports.includes('shouldRevalidate')
    ? 'NessRoute.shouldRevalidate'
    : server.exports.includes('shouldRevalidate')
      ? 'NessServerRoute.shouldRevalidate'
      : 'undefined';
}

/**
 * Emits the route as one that shows `boundaryFile` while its data is loading,
 * instead of holding the previous page on screen until the data arrives.
 *
 * The router cannot commit a navigation until every loader in the chain has
 * answered, so the only way a segment gets to render its `loading.tsx` on a
 * client-side navigation is for its loader to answer straight away and finish
 * the work afterwards. That is what `streamRoute` wraps it to do — which is
 * also why this is generated rather than written by hand: a page states what
 * it loads, and where the waiting shows up is the framework's business.
 */
function appendStreamedRoute(
  lines: string[],
  {
    generatedFile,
    modulePath,
    boundaryFile,
    routeId,
    namedExports,
    server,
    defaultSeconds,
    minimumMs,
  }: StreamedRouteOptions,
): void {
  const userShouldRevalidate = userShouldRevalidateExpression(
    namedExports,
    server,
  );
  lines.push(`import * as NessRoute from ${modulePath};`);
  // Only when the route's `shouldRevalidate` lives there: a `.server` module
  // is pulled into this graph by a re-export it actually needs, never by one
  // it turned out not to.
  if (userShouldRevalidate === 'NessServerRoute.shouldRevalidate')
    lines.push(`import * as NessServerRoute from ${server.module};`);
  lines.push(
    `import NessLoading from ${JSON.stringify(importPath(generatedFile, boundaryFile))};`,
  );
  lines.push("import {streamRoute} from '@nessframework/core/client';");
  lines.push(
    `const NessStreamed = streamRoute(NessRoute, NessLoading, {id: ${JSON.stringify(routeId)}, serverLoader: ${server.exports.includes('loader') || namedExports.includes('loader')}, shouldRevalidate: ${userShouldRevalidate}${defaultSeconds > 0 ? `, defaultSeconds: ${defaultSeconds}` : ''}${minimumMs > 0 ? `, minimumMs: ${minimumMs}` : ''}});`,
  );
  lines.push('const NessComponent = NessStreamed.Component;');
  lines.push('export const clientLoader = NessStreamed.clientLoader;');
  lines.push('export const shouldRevalidate = NessStreamed.shouldRevalidate;');
  // The same boundary answers for hydration, so a cold load and a navigation
  // into this route look identical: whatever fills the page while the data is
  // in flight keeps filling it, rather than being swapped for a second
  // skeleton the moment the router takes over.
  lines.push('export const HydrateFallback = NessLoading;');
  // Everything the route declares other than the three exports above, which
  // this module now owns.
  const owned = new Set(['clientLoader', 'shouldRevalidate']);
  const passthrough = namedExports.filter(name => !owned.has(name));
  if (passthrough.length)
    lines.push(`export {${passthrough.join(', ')}} from ${modulePath};`);
  const serverPassthrough = server.exports.filter(name => !owned.has(name));
  if (serverPassthrough.length)
    lines.push(
      `export {${serverPassthrough.join(', ')}} from ${server.module};`,
    );
}

interface CachedRouteOptions {
  modulePath: string;
  routeId: string | undefined;
  namedExports: string[];
  server: AdjacentServer;
  defaultSeconds: number;
}

/**
 * Emits the route with its navigations answerable from memory — the page's
 * own `clientCache` export, or the application-wide default — without a
 * `loading.tsx` in sight. The wrapper owns `clientLoader`/`shouldRevalidate`
 * exactly the way the streamed wrapper does; the only thing missing is the
 * boundary, so a load that must reach the network blocks the navigation the
 * way it always did.
 */
function appendCachedRoute(
  lines: string[],
  {
    modulePath,
    routeId,
    namedExports,
    server,
    defaultSeconds,
  }: CachedRouteOptions,
): void {
  const userShouldRevalidate = userShouldRevalidateExpression(
    namedExports,
    server,
  );
  lines.push(`import * as NessRoute from ${modulePath};`);
  if (userShouldRevalidate === 'NessServerRoute.shouldRevalidate')
    lines.push(`import * as NessServerRoute from ${server.module};`);
  lines.push("import {cacheRoute} from '@nessframework/core/client';");
  lines.push(
    `const NessCached = cacheRoute(NessRoute, {id: ${JSON.stringify(routeId)}, serverLoader: ${server.exports.includes('loader') || namedExports.includes('loader')}, shouldRevalidate: ${userShouldRevalidate}${defaultSeconds > 0 ? `, defaultSeconds: ${defaultSeconds}` : ''}});`,
  );
  lines.push('const NessComponent = NessCached.Component;');
  lines.push('export const clientLoader = NessCached.clientLoader;');
  lines.push('export const shouldRevalidate = NessCached.shouldRevalidate;');
  const owned = new Set(['clientLoader', 'shouldRevalidate']);
  const passthrough = namedExports.filter(name => !owned.has(name));
  if (passthrough.length)
    lines.push(`export {${passthrough.join(', ')}} from ${modulePath};`);
  const serverPassthrough = server.exports.filter(name => !owned.has(name));
  if (serverPassthrough.length)
    lines.push(
      `export {${serverPassthrough.join(', ')}} from ${server.module};`,
    );
}

/**
 * Wraps the route's element in the segment's `template.tsx`, keyed by the
 * history entry.
 *
 * That key is the whole difference between a template and a layout: a layout
 * persists across a navigation and keeps its state, a template is torn down
 * and built again, which is what an entry animation or a per-visit effect
 * needs. It goes around the element rather than inside the layout because the
 * layout is the application's own file and the framework has nowhere to reach
 * into it — and the child element sits exactly where Next puts a template
 * anyway: inside the layout, around the part that changes.
 */
function appendTemplate(
  lines: string[],
  {
    generatedFile,
    templateFile,
    component,
  }: { generatedFile: string; templateFile: string; component: string },
): void {
  lines.push(
    `import NessTemplate from ${JSON.stringify(importPath(generatedFile, templateFile))};`,
  );
  lines.push("import {useLocation as nessUseLocation} from 'react-router';");
  lines.push("import {createElement as nessCreateElement} from 'react';");
  lines.push(
    'function NessTemplated(props){\n' +
      '  const location = nessUseLocation();\n' +
      `  return nessCreateElement(NessTemplate, {key: location.key}, nessCreateElement(${component}, props));\n` +
      '}',
  );
}

interface WrapperOptions extends BoundaryFiles {
  generatedFile: string;
  sourceFile?: string | undefined;
  loadingFile?: string | undefined;
  boundaryFile?: string | undefined;
  templateFile?: string | undefined;
  routeId?: string | undefined;
  middlewareFile?: string | undefined;
  fallbackLayout?: boolean;
  status?: number | undefined;
  /** Ancestor layout files that export static `metadata`, outermost first. */
  metadataParents?: string[];
  /** File-declared metadata for this segment (icons, social images). */
  fileMetadata?: FileMetadata | undefined;
  /** This segment's public URL path, for file-metadata route hrefs. */
  urlPath?: string;
  /** Parallel-route slots: prop name → generated slot module. */
  slots?: Array<{ name: string; file: string }>;
  /** The application-wide `clientCache` default, in seconds. */
  clientCacheDefault?: number;
  /** The application-wide `minimumLoadingMs` default, in milliseconds. */
  minimumLoadingDefault?: number;
}

/** What the wrapper turned out to be, for the prefetch table. */
interface WrapperInfo {
  streamed: boolean;
  cached: boolean;
  hasServerLoader: boolean;
}

function createWrapper({
  generatedFile,
  sourceFile,
  errorFile,
  loadingFile,
  boundaryFile,
  templateFile,
  routeId,
  middlewareFile,
  notFoundFile,
  forbiddenFile,
  unauthorizedFile,
  fallbackLayout = false,
  status,
  metadataParents = [],
  fileMetadata,
  urlPath = '',
  slots = [],
  clientCacheDefault = 0,
  minimumLoadingDefault = 0,
}: WrapperOptions): WrapperInfo {
  const lines = ['// Generated by Ness.js. Do not edit.'];
  let namedExports: string[] = [];
  let serverExports: string[] = [];
  let streamed = false;
  let cached = false;
  let hasServerLoader = false;
  if (sourceFile) {
    const modulePath = JSON.stringify(importPath(generatedFile, sourceFile));
    const source = fs.readFileSync(sourceFile, 'utf8');
    namedExports = findNamedExports(source);
    const server = findAdjacentServer(generatedFile, sourceFile);
    serverExports = server.exports;
    // Nothing to wait for means nothing to show a fallback for: a route
    // without a loader is emitted exactly as it always was, so a `loading.tsx`
    // costs nothing where there is no data.
    hasServerLoader =
      namedExports.includes('loader') || serverExports.includes('loader');
    const hasLoader = namedExports.includes('clientLoader') || hasServerLoader;
    streamed = Boolean(boundaryFile) && hasLoader;
    // No boundary, but navigations may still be answered from memory — when
    // the page asked with its own `clientCache`, or the application set a
    // default for every page. A route neither asked about is emitted exactly
    // as it always was, keeping its loaders in the batched data request.
    cached =
      !streamed &&
      hasLoader &&
      Boolean(routeId) &&
      (namedExports.includes('clientCache') || clientCacheDefault > 0);
    if (streamed) {
      appendStreamedRoute(lines, {
        generatedFile,
        modulePath,
        boundaryFile: boundaryFile!,
        routeId,
        namedExports,
        server,
        defaultSeconds: clientCacheDefault,
        minimumMs: minimumLoadingDefault,
      });
    } else if (cached) {
      appendCachedRoute(lines, {
        modulePath,
        routeId,
        namedExports,
        server,
        defaultSeconds: clientCacheDefault,
      });
    } else {
      lines.push(`import NessComponent from ${modulePath};`);
      if (namedExports.length)
        lines.push(`export {${namedExports.join(', ')}} from ${modulePath};`);
      if (serverExports.length)
        lines.push(
          `export {${serverExports.join(', ')}} from ${server.module};`,
        );
    }
  } else if (fallbackLayout) {
    lines.push("import {Outlet} from 'react-router';");
    lines.push('function NessComponent(){ return <Outlet />; }');
  }
  if (sourceFile || fallbackLayout) {
    // The default export is built up in stages: slots compose around the
    // component, metadata tags render beside it, the template wraps last.
    // Each stage takes the previous stage's name and leaves a new one.
    let component = 'NessComponent';

    if (slots.length) {
      for (const slot of slots) {
        lines.push(
          `import NessSlot_${slot.name} from ${JSON.stringify(importPath(generatedFile, slot.file))};`,
        );
      }
      const slotProps = slots
        .map(
          slot =>
            `${JSON.stringify(slot.name)}: <NessSlot_${slot.name} params={props?.params ?? {}} />`,
        )
        .join(', ');
      lines.push(
        `function NessSlotted(props){ return <${component} {...props} {...{${slotProps}}} />; }`,
      );
      component = 'NessSlotted';
    }

    const ownMetadata = sourceFile
      ? metadataExports(fs.readFileSync(sourceFile, 'utf8'))
      : { metadata: false, generateMetadata: false };
    if (ownMetadata.metadata || ownMetadata.generateMetadata) {
      lines.push(
        "import {RouteMetadata as NessRouteMetadata} from '@nessframework/components';",
      );
      lines.push(
        `import * as NessMetadataModule from ${JSON.stringify(importPath(generatedFile, sourceFile!))};`,
      );
      const parents = metadataParents.map((file, index) => {
        lines.push(
          `import * as NessMetadataParent${index} from ${JSON.stringify(importPath(generatedFile, file))};`,
        );
        return `NessMetadataParent${index}.metadata`;
      });
      const expression = ownMetadata.metadata
        ? 'NessMetadataModule.metadata'
        : 'NessMetadataModule.generateMetadata';
      const previous = component;
      lines.push(
        `function NessWithMetadata(props){ return (<><NessRouteMetadata metadata={${expression}} args={{params: props?.params ?? {}, loaderData: props?.loaderData}} parents={[${parents.join(', ')}]} /><${previous} {...props} /></>); }`,
      );
      component = 'NessWithMetadata';
    }

    // The separate `viewport`/`generateViewport` export, the way Next splits
    // it out of `metadata`. Rendered beside the component like the metadata
    // tags are; when a layout and its page both declare one, the page's tag
    // comes later in document order and the browser applies it — the deepest
    // segment wins.
    const ownViewport = sourceFile
      ? viewportExports(fs.readFileSync(sourceFile, 'utf8'))
      : { viewport: false, generateViewport: false };
    if (ownViewport.viewport || ownViewport.generateViewport) {
      lines.push(
        "import {RouteViewport as NessRouteViewport} from '@nessframework/components';",
      );
      lines.push(
        `import * as NessViewportModule from ${JSON.stringify(importPath(generatedFile, sourceFile!))};`,
      );
      const expression = ownViewport.viewport
        ? 'NessViewportModule.viewport'
        : 'NessViewportModule.generateViewport';
      const previous = component;
      lines.push(
        `function NessWithViewport(props){ return (<><NessRouteViewport viewport={${expression}} args={{params: props?.params ?? {}}} /><${previous} {...props} /></>); }`,
      );
      component = 'NessWithViewport';
    }

    if (fileMetadata) {
      lines.push(
        "import {FileMetadataTags as NessFileMetadataTags} from '@nessframework/components';",
      );
      const asset = (file: string, index: number, kind: string): string => {
        lines.push(
          `import nessAsset_${kind}${index} from ${JSON.stringify(importPath(generatedFile, file))};`,
        );
        return `nessAsset_${kind}${index}`;
      };
      const icon = fileMetadata.icon.map((file, i) => asset(file, i, 'icon'));
      const apple = fileMetadata.apple.map((file, i) =>
        asset(file, i, 'apple'),
      );
      const og = fileMetadata.ogStatic.map((file, i) => asset(file, i, 'og'));
      const twitter = fileMetadata.twitterStatic.map((file, i) =>
        asset(file, i, 'twitter'),
      );
      const prefix = urlPath ? `/${urlPath}` : '';
      if (fileMetadata.ogModule)
        og.push(JSON.stringify(`${prefix}/opengraph-image`));
      if (fileMetadata.twitterModule)
        twitter.push(JSON.stringify(`${prefix}/twitter-image`));
      const previous = component;
      lines.push(
        `function NessWithFileMetadata(props){ return (<><NessFileMetadataTags icon={[${icon.join(', ')}]} apple={[${apple.join(', ')}]} og={[${og.join(', ')}]} twitter={[${twitter.join(', ')}]} params={props?.params ?? {}} /><${previous} {...props} /></>); }`,
      );
      component = 'NessWithFileMetadata';
    }

    if (templateFile) {
      appendTemplate(lines, { generatedFile, templateFile, component });
      lines.push('export default NessTemplated;');
    } else {
      lines.push(`export default ${component};`);
    }
  }
  if (
    status &&
    !namedExports.includes('loader') &&
    !serverExports.includes('loader')
  ) {
    lines.push("import {data as nessStatusData} from 'react-router';");
    lines.push(
      `export function loader(){ return nessStatusData(null, {status: ${status}, statusText: ${JSON.stringify(status === 404 ? 'Not Found' : 'Error')}}); }`,
    );
  }
  appendBoundary(lines, generatedFile, {
    errorFile,
    notFoundFile,
    forbiddenFile,
    unauthorizedFile,
  });
  if (loadingFile && !streamed)
    lines.push(
      `export {default as HydrateFallback} from ${JSON.stringify(importPath(generatedFile, loadingFile))};`,
    );
  if (middlewareFile)
    lines.push(...middlewareLines(generatedFile, middlewareFile));
  writeIfChanged(generatedFile, `${lines.join('\n')}\n`);
  return { streamed, cached, hasServerLoader };
}

function createResourceWrapper({
  generatedFile,
  sourceFile,
  middlewareFile,
}: {
  generatedFile: string;
  sourceFile: string;
  middlewareFile?: string | undefined;
}): void {
  const modulePath = JSON.stringify(importPath(generatedFile, sourceFile));
  const source = fs.readFileSync(sourceFile, 'utf8');
  const routeExports = ['headers', 'handle', 'shouldRevalidate']
    .filter(name =>
      new RegExp(
        `\\bexport\\s+(?:async\\s+)?(?:function|const|let|var)\\s+${name}\\b`,
      ).test(source),
    )
    .map(name => `export const ${name} = RouteHandler.${name};`)
    .join('\n');
  const middleware = middlewareFile
    ? middlewareLines(generatedFile, middlewareFile)
    : [];
  const middlewareImport = middleware.slice(0, -1).join('\n');
  const middlewareExport = middleware.at(-1) ?? '';
  const content = `// Generated by Ness.js. Do not edit.
import * as RouteHandler from ${modulePath};
${middlewareImport}

async function dispatch({request, params, context}: {request: Request; params: Record<string, string | undefined>; context: unknown}) {
  const handlers = RouteHandler as Record<string, unknown>;
  const handler = handlers[request.method];
  if (typeof handler !== 'function') {
    const allow = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
      .filter(method => typeof handlers[method] === 'function');
    return new Response('Method Not Allowed', {status: 405, headers: {Allow: allow.join(', ')}});
  }
  return handler(request, {params: Promise.resolve(params), context});
}

export const loader = dispatch;
export const action = dispatch;
${routeExports}
${middlewareExport}
`;
  writeIfChanged(generatedFile, content);
}

/**
 * The HTTP methods a `route.ts` module exports, read off its source the way
 * every other build-time question is. Needed before the module can be run:
 * `prerender: true` has to know that a POST-only endpoint cannot answer the
 * GET a prerender would send it.
 */
function resourceMethods(sourceFile: string): string[] {
  const source = fs.readFileSync(sourceFile, 'utf8');
  return ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].filter(
    method =>
      new RegExp(
        `\\bexport\\s+(?:async\\s+)?(?:function|const|let|var)\\s+${method}\\b`,
      ).test(source),
  );
}

/**
 * A `sitemap`/`robots`/`manifest` module, published as the file it describes.
 *
 * The application exports a default function returning ordinary data; the
 * serialization — the XML, the content type, the escaping — is the
 * framework's, because getting it wrong is silent and every project would
 * otherwise write it again.
 */
function createMetadataWrapper({
  generatedFile,
  sourceFile,
  serializer,
}: {
  generatedFile: string;
  sourceFile: string;
  serializer: string;
}): void {
  const modulePath = JSON.stringify(importPath(generatedFile, sourceFile));
  writeIfChanged(
    generatedFile,
    `// Generated by Ness.js. Do not edit.
import NessMetadata from ${modulePath};
import {${serializer}} from '@nessframework/core/metadata';

export async function loader(args) {
  return ${serializer}(
    typeof NessMetadata === 'function' ? await NessMetadata(args) : NessMetadata,
  );
}
`,
  );
}

/**
 * A parallel-route slot, composed as a component the layout receives by prop.
 *
 * `@analytics/page.tsx` renders wherever the layout puts `{analytics}`; the
 * slot's own `loading.tsx` and `error.tsx` become its Suspense and error
 * boundaries, so one slot failing or suspending never takes the others down.
 * `default.tsx` renders when the slot has no page of its own.
 */
function createSlotWrapper({
  generatedFile,
  pageFile,
  defaultFile,
  loadingFile,
  errorFile,
}: {
  generatedFile: string;
  pageFile?: string | undefined;
  defaultFile?: string | undefined;
  loadingFile?: string | undefined;
  errorFile?: string | undefined;
}): void {
  const lines = ['// Generated by Ness.js. Do not edit.'];
  const contentFile = pageFile ?? defaultFile;
  lines.push("import {SlotBoundary} from '@nessframework/components';");
  if (contentFile)
    lines.push(
      `import NessSlotContent from ${JSON.stringify(importPath(generatedFile, contentFile))};`,
    );
  if (loadingFile)
    lines.push(
      `import NessSlotLoading from ${JSON.stringify(importPath(generatedFile, loadingFile))};`,
    );
  if (errorFile)
    lines.push(
      `import NessSlotError from ${JSON.stringify(importPath(generatedFile, errorFile))};`,
    );
  const content = contentFile ? '<NessSlotContent {...props} />' : 'null';
  const fallback = loadingFile ? ' fallback={<NessSlotLoading />}' : '';
  const errorFallback = errorFile ? ' errorFallback={<NessSlotError />}' : '';
  lines.push(
    `export default function NessSlot(props){ return (<SlotBoundary${fallback}${errorFallback}>${content}</SlotBoundary>); }`,
  );
  writeIfChanged(generatedFile, `${lines.join('\n')}\n`);
}

/**
 * An `opengraph-image.tsx`/`twitter-image.tsx` module, published as the image
 * route it describes. The module default-exports a function receiving
 * `{params}` and returning a `Response` — usually an `ImageResponse` from
 * `@nessframework/assets/og`.
 *
 * A module that also exports `generateImageMetadata` serves several images
 * from one route, Next-style: the function receives `{params}` and returns
 * `[{id, contentType?, alt?}, ...]`; each image is addressed as `?id=<id>`
 * and the default export receives that `id` alongside the params. An `id`
 * the function did not list answers 404 — the list is the route's contract,
 * not a hint.
 */
function createImageRouteWrapper({
  generatedFile,
  sourceFile,
}: {
  generatedFile: string;
  sourceFile: string;
}): void {
  const modulePath = JSON.stringify(importPath(generatedFile, sourceFile));
  writeIfChanged(
    generatedFile,
    `// Generated by Ness.js. Do not edit.
import * as NessImageModule from ${modulePath};

export async function loader(args: {request: Request; params: Record<string, string | undefined>}) {
  const module = NessImageModule as {
    contentType?: string;
    generateImageMetadata?: (input: {params: Record<string, string | undefined>}) => Promise<Array<{id: string | number; contentType?: string}>> | Array<{id: string | number; contentType?: string}>;
  };
  let contentType = module.contentType;
  let id: string | undefined;
  if (typeof module.generateImageMetadata === 'function') {
    const images = await module.generateImageMetadata({params: args.params});
    id = new URL(args.request.url).searchParams.get('id') ?? String(images[0]?.id ?? '');
    const image = images.find(entry => String(entry.id) === id);
    if (!image) return new Response('Not Found', {status: 404});
    contentType = image.contentType || contentType;
  }
  const produced = await NessImageModule.default({...args, ...(id === undefined ? {} : {id})});
  if (produced instanceof Response) return produced;
  return new Response(produced, {
    headers: {
      'content-type': contentType || 'image/png',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
`,
  );
}

/**
 * The module declaring the page's `generateStaticParams`, if either the page
 * or its `.server` sibling does. The sibling wins: the function runs at build
 * time on the server, which is where a `.server` module's imports belong —
 * declaring it on the page itself also works, but drags whatever the function
 * needs into a module the client bundles.
 */
function staticParamsModule(sourceFile: string): string | undefined {
  const declares = (file: string): boolean =>
    /\bexport\s+(?:async\s+)?(?:function|const|let|var)\s+generateStaticParams\b/.test(
      fs.readFileSync(file, 'utf8'),
    );
  const extension = path.extname(sourceFile);
  const base = sourceFile.slice(0, -extension.length);
  const serverFile = ROUTE_EXTENSIONS.map(
    candidate => `${base}.server${candidate}`,
  ).find(fs.existsSync);
  if (serverFile && declares(serverFile)) return serverFile;
  return declares(sourceFile) ? sourceFile : undefined;
}

/**
 * Substitutes one `generateStaticParams` result into a page's URL pattern:
 * `:slug` takes `params.slug`, and a catch-all (`*` in the compiled pattern —
 * `[...slug]` in the directory name) takes the params' single array value,
 * joined with slashes. A pattern still holding a `:param` afterwards is not a
 * concrete path and is dropped rather than prerendered misspelled.
 */
function fillStaticPath(
  pattern: string,
  params: Record<string, unknown>,
): string | undefined {
  let filled = pattern.replace(/:([A-Za-z0-9_]+)/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
  if (filled.includes('*')) {
    const rest = Object.values(params).find(Array.isArray) as
      unknown[] | undefined;
    if (rest) filled = filled.replace('*', rest.map(String).join('/'));
  }
  return /[:*]/.test(filled) ? undefined : filled;
}

/**
 * Runs every page's `generateStaticParams` and returns the concrete paths
 * they name — what `router.prerender` gets extended with at build time. The
 * modules are imported for real here, exactly the way Next runs the function
 * at build: this is the one route-generation step that executes application
 * code, and it only happens for pages that wrote the export.
 */
async function expandStaticParams(pages: NessRoutePath[]): Promise<string[]> {
  const paths: string[] = [];
  for (const page of pages) {
    if (!page.staticParams) continue;
    // A static path has no params to generate; the export is meaningless there.
    if (!/[:*]/.test(page.path)) continue;
    const module = (await import(
      /* @vite-ignore */ pathToFileURL(page.staticParams).href
    )) as {
      generateStaticParams?: (args: {
        params: Record<string, string | undefined>;
      }) =>
        | Promise<Array<Record<string, unknown>>>
        | Array<Record<string, unknown>>;
    };
    if (typeof module.generateStaticParams !== 'function') continue;
    const sets = await module.generateStaticParams({ params: {} });
    for (const params of sets ?? []) {
      const filled = fillStaticPath(page.path, params ?? {});
      if (filled) paths.push(filled);
    }
  }
  return paths;
}

/** A page's own config, or its `.server` module's — whichever declares it. */
function segmentConfigFor(sourceFile: string): SegmentConfig | undefined {
  const own = findSegmentConfig(fs.readFileSync(sourceFile, 'utf8'));
  const extension = path.extname(sourceFile);
  const base = sourceFile.slice(0, -extension.length);
  const serverFile = ROUTE_EXTENSIONS.map(
    candidate => `${base}.server${candidate}`,
  ).find(fs.existsSync);
  const server = serverFile
    ? findSegmentConfig(fs.readFileSync(serverFile, 'utf8'))
    : undefined;
  if (!own && !server) return undefined;
  return { ...server, ...own };
}

function moduleId(
  routesDirectory: string,
  directory: string,
  suffix: string,
): string {
  const relative = slash(path.relative(routesDirectory, directory)) || 'root';
  return `${relative.replace(/[^a-zA-Z0-9_-]+/g, '__')}__${suffix}`;
}

function routeFile(appDirectory: string, generatedFile: string): string {
  return slash(path.relative(appDirectory, generatedFile));
}

interface DiscoverOptions {
  appDirectory: string;
  routesDirectory: string;
  generatedDirectory: string;
  directory: string;
  root?: boolean;
  inheritedLoadingFile?: string | undefined;
  parentTemplateFile?: string | undefined;
  /** This directory's public URL path, without a leading slash. */
  urlPath?: string;
  /** Ancestor layouts with a static `metadata` export, outermost first. */
  metadataParents?: string[];
  /** The application-wide `clientCache` default, in seconds. */
  clientCacheDefault?: number;
  /** The application-wide `minimumLoadingMs` default, in milliseconds. */
  minimumLoadingDefault?: number;
}

function discoverDirectory(
  options: {
    root: true;
  } & DiscoverOptions,
): NessRoute[];
function discoverDirectory(
  options: DiscoverOptions,
): NessRoute[] | NessRoute | undefined;
function discoverDirectory({
  appDirectory,
  routesDirectory,
  generatedDirectory,
  directory,
  root = false,
  inheritedLoadingFile,
  parentTemplateFile,
  urlPath = '',
  metadataParents = [],
  clientCacheDefault = 0,
  minimumLoadingDefault = 0,
}: DiscoverOptions): NessRoute[] | NessRoute | undefined {
  const layoutFile = findModule(directory, 'layout');
  const pageFile = findModule(directory, 'page');
  const resourceFile = findModule(directory, 'route');
  const errorFile = findModule(directory, 'error');
  const loadingFile = findModule(directory, 'loading');
  const middlewareFile = findModule(directory, 'middleware');
  const notFoundFile = findModule(directory, 'not-found');
  const forbiddenFile = findModule(directory, 'forbidden');
  const unauthorizedFile = findModule(directory, 'unauthorized');
  const fileMetadata = findFileMetadata(directory);
  if (pageFile && resourceFile) {
    throw new Error(
      `A Ness route cannot contain both page and route modules: ${directory}`,
    );
  }

  // Children see this layout in their metadata chain only when it actually
  // declares a static `metadata` object — a template cannot be read off a
  // `generateMetadata` without running it.
  const childMetadataParents =
    layoutFile && metadataExports(fs.readFileSync(layoutFile, 'utf8')).metadata
      ? [...metadataParents, layoutFile]
      : metadataParents;

  // A segment's `loading.tsx` covers what the segment renders *inside* its own
  // layout — its page and everything nested under it — and not the layout
  // itself, which belongs to the segment above. That one line is the whole
  // nesting rule: moving between two pages under the same layout replaces the
  // page area, and a navigation that reloads the layout falls back a level up.
  const childLoadingFile = loadingFile ?? inheritedLoadingFile;

  // A template belongs to its own segment's children and no deeper: one
  // instance in the tree, in the same position the boundary sits in.
  const templateFile = findModule(directory, 'template');

  const allDirectories = fs.existsSync(directory)
    ? fs
        .readdirSync(directory, { withFileTypes: true })
        .filter(
          entry =>
            entry.isDirectory() &&
            !entry.name.startsWith('.') &&
            entry.name !== 'node_modules',
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  // Slots and interceptors are not route children: a slot renders inside its
  // own layout's props, and an interceptor renders over whatever is already
  // on screen. Both are pulled out before ordinary recursion.
  const slotDirectories = allDirectories.filter(entry =>
    entry.name.startsWith('@'),
  );
  const interceptorDirectories = allDirectories.filter(entry =>
    INTERCEPTOR_PREFIX.test(entry.name),
  );
  const childDirectories = allDirectories.filter(
    entry =>
      !entry.name.startsWith('@') && !INTERCEPTOR_PREFIX.test(entry.name),
  );
  const children: NessRoute[] = [];

  for (const entry of interceptorDirectories) {
    collectInterceptors(path.join(directory, entry.name), entry.name, urlPath);
  }

  const slots: Array<{ name: string; file: string }> = [];
  for (const entry of slotDirectories) {
    const slotDirectory = path.join(directory, entry.name);
    const name = entry.name.slice(1).replace(/[^A-Za-z0-9_$]/g, '_');
    const generatedFile = path.join(
      generatedDirectory,
      `${moduleId(routesDirectory, slotDirectory, 'slot')}.tsx`,
    );
    createSlotWrapper({
      generatedFile,
      pageFile: findModule(slotDirectory, 'page'),
      defaultFile: findModule(slotDirectory, 'default'),
      loadingFile: findModule(slotDirectory, 'loading'),
      errorFile: findModule(slotDirectory, 'error'),
    });
    slots.push({ name, file: generatedFile });
    // Interceptors live inside slots in the canonical modal pattern.
    for (const nested of fs.readdirSync(slotDirectory, {
      withFileTypes: true,
    })) {
      if (nested.isDirectory() && INTERCEPTOR_PREFIX.test(nested.name)) {
        collectInterceptors(
          path.join(slotDirectory, nested.name),
          nested.name,
          urlPath,
        );
      }
    }
  }
  if (slots.length && !layoutFile) {
    throw new Error(
      `Parallel route slots need a layout.tsx to receive them as props: ${directory}`,
    );
  }

  if (pageFile) {
    const generatedFile = path.join(
      generatedDirectory,
      `${moduleId(routesDirectory, directory, 'page')}.tsx`,
    );
    const segmentConfig = segmentConfigFor(pageFile);
    const staticParams = staticParamsModule(pageFile);
    const wrapper = createWrapper({
      generatedFile,
      routeId: moduleId(routesDirectory, directory, 'page'),
      sourceFile: pageFile,
      errorFile: layoutFile ? undefined : errorFile,
      loadingFile: layoutFile ? undefined : loadingFile,
      boundaryFile: childLoadingFile,
      templateFile,
      middlewareFile: layoutFile ? undefined : middlewareFile,
      notFoundFile: layoutFile ? undefined : notFoundFile,
      forbiddenFile: layoutFile ? undefined : forbiddenFile,
      unauthorizedFile: layoutFile ? undefined : unauthorizedFile,
      metadataParents: childMetadataParents,
      // The layout announces the segment's file metadata when there is one;
      // otherwise the page carries its own.
      fileMetadata: layoutFile ? undefined : fileMetadata,
      urlPath,
      clientCacheDefault,
      minimumLoadingDefault,
    });
    children.push({
      id: moduleId(routesDirectory, directory, 'page'),
      index: true,
      file: routeFile(appDirectory, generatedFile),
      ...(segmentConfig ? { config: segmentConfig } : {}),
      ...(staticParams ? { staticParams } : {}),
      prefetch: {
        serverLoader: wrapper.hasServerLoader,
        wrapped: wrapper.streamed || wrapper.cached,
      },
    });
  }

  for (const [basename, moduleFile] of [
    ['opengraph-image', fileMetadata?.ogModule],
    ['twitter-image', fileMetadata?.twitterModule],
  ] as const) {
    if (!moduleFile) continue;
    const generatedFile = path.join(
      generatedDirectory,
      `${moduleId(routesDirectory, directory, basename.replace('-', '_'))}.ts`,
    );
    createImageRouteWrapper({ generatedFile, sourceFile: moduleFile });
    children.push({
      id: moduleId(routesDirectory, directory, basename.replace('-', '_')),
      path: basename,
      file: routeFile(appDirectory, generatedFile),
    });
  }

  for (const metadata of METADATA_FILES) {
    const sourceFile = findModule(directory, metadata.basename);
    if (!sourceFile) continue;
    const generatedFile = path.join(
      generatedDirectory,
      `${moduleId(routesDirectory, directory, metadata.basename)}.ts`,
    );
    createMetadataWrapper({
      generatedFile,
      sourceFile,
      serializer: metadata.serializer,
    });
    children.push({
      id: moduleId(routesDirectory, directory, metadata.basename),
      path: metadata.path,
      file: routeFile(appDirectory, generatedFile),
    });
  }

  if (resourceFile) {
    const generatedFile = path.join(
      generatedDirectory,
      `${moduleId(routesDirectory, directory, 'resource')}.ts`,
    );
    createResourceWrapper({
      generatedFile,
      sourceFile: resourceFile,
      middlewareFile,
    });
    children.push({
      id: moduleId(routesDirectory, directory, 'resource'),
      index: true,
      file: routeFile(appDirectory, generatedFile),
      methods: resourceMethods(resourceFile),
    });
  }

  for (const child of childDirectories) {
    const childSegment = segmentPath(child.name);
    const childRoute = discoverDirectory({
      appDirectory,
      routesDirectory,
      generatedDirectory,
      directory: path.join(directory, child.name),
      inheritedLoadingFile: childLoadingFile,
      parentTemplateFile: templateFile,
      // Groups and private folders add no URL segment.
      urlPath:
        childSegment === undefined
          ? urlPath
          : [urlPath, childSegment].filter(Boolean).join('/'),
      metadataParents: childMetadataParents,
      clientCacheDefault,
      minimumLoadingDefault,
    });
    if (childRoute) children.push(childRoute as NessRoute);
  }

  if (notFoundFile) {
    const generatedFile = path.join(
      generatedDirectory,
      `${moduleId(routesDirectory, directory, 'not-found')}.tsx`,
    );
    createWrapper({
      generatedFile,
      sourceFile: notFoundFile,
      errorFile,
      status: 404,
    });
    children.push({
      id: moduleId(routesDirectory, directory, 'not-found'),
      path: '*',
      file: routeFile(appDirectory, generatedFile),
    });
  }

  if (root && !layoutFile) return children;
  if (!layoutFile && children.length === 0) return undefined;

  const generatedFile = path.join(
    generatedDirectory,
    `${moduleId(routesDirectory, directory, 'layout')}.tsx`,
  );
  createWrapper({
    generatedFile,
    routeId: moduleId(routesDirectory, directory, 'layout'),
    sourceFile: layoutFile,
    errorFile,
    loadingFile,
    boundaryFile: inheritedLoadingFile,
    templateFile: parentTemplateFile,
    middlewareFile,
    notFoundFile,
    forbiddenFile,
    unauthorizedFile,
    fallbackLayout: !layoutFile,
    metadataParents,
    fileMetadata: layoutFile ? fileMetadata : undefined,
    urlPath,
    slots,
    clientCacheDefault,
    minimumLoadingDefault,
  });
  const entry: NessRoute = {
    id: moduleId(routesDirectory, directory, 'layout'),
    file: routeFile(appDirectory, generatedFile),
    children,
  };
  if (!root) {
    const pathname = segmentPath(path.basename(directory));
    if (pathname !== undefined) entry.path = pathname;
  }
  return root ? [entry] : entry;
}

/**
 * Re-keys a route subtree so the same modules can be mounted twice — once at
 * the root and once under a locale prefix — without colliding on route ids.
 */
function prefixRouteIds(routes: NessRoute[], prefix: string): NessRoute[] {
  return routes.map(route => ({
    ...route,
    id: `${prefix}/${route.id}`,
    ...(route.children
      ? { children: prefixRouteIds(route.children, prefix) }
      : {}),
  }));
}

/**
 * Emits the pass-through layout that owns a locale segment.
 *
 * Each locale gets its own static path segment rather than one shared
 * `:locale` parameter. A parameter outranks both the root `*` not-found route
 * and any top-level dynamic route, so `/nope` would be captured as a locale and
 * the application's own 404 would never render. A static segment only matches
 * the locale it names, which is what the routing actually means — and it
 * removes the need to validate the segment at runtime.
 */
function createLocaleLayout(generatedDirectory: string): string {
  const generatedFile = path.join(generatedDirectory, 'ness__locale.tsx');
  writeIfChanged(
    generatedFile,
    `// Generated by Ness.js. Do not edit.
import {Outlet} from 'react-router';

export default function NessLocaleLayout() {
  return <Outlet />;
}
`,
  );
  return generatedFile;
}

/**
 * The last boundary standing: `app/routes/global-error.tsx`, wrapped around
 * the entire route tree as a pathless route whose ErrorBoundary it becomes.
 *
 * It catches whatever no segment boundary caught. Unlike Next's, it renders
 * inside `root.tsx` rather than replacing it — the document shell is the
 * application's own file here and stays up; what this replaces is everything
 * inside it. The component receives Next's `{error, reset}` contract.
 */
function createGlobalErrorLayout(
  generatedDirectory: string,
  sourceFile: string,
): string {
  const generatedFile = path.join(generatedDirectory, 'ness__global_error.tsx');
  writeIfChanged(
    generatedFile,
    `// Generated by Ness.js. Do not edit.
import {Outlet, useRouteError} from 'react-router';
import NessGlobalError from ${JSON.stringify(importPath(generatedFile, sourceFile))};

export default function NessGlobalErrorShell() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const raw = useRouteError();
  const error =
    raw instanceof Error
      ? raw
      : new Error(typeof raw === 'string' ? raw : JSON.stringify(raw));
  const reset = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };
  return <NessGlobalError error={error} reset={reset} />;
}
`,
  );
  return generatedFile;
}

async function nessRoutes({
  appDirectory = path.join(process.cwd(), 'app'),
  routesDirectory,
  generatedDirectory,
  i18n,
  clientCache,
  minimumLoadingMs,
}: NessRoutesOptions = {}): Promise<NessRoute[]> {
  const absoluteAppDirectory = path.resolve(appDirectory);
  const absoluteRoutesDirectory = path.resolve(
    routesDirectory ?? path.join(appDirectory, 'routes'),
  );
  const absoluteGeneratedDirectory = path.resolve(
    generatedDirectory ?? path.join(appDirectory, '.ness', 'routes'),
  );
  if (!fs.existsSync(absoluteRoutesDirectory)) {
    throw new Error(
      `Ness routes directory does not exist: ${absoluteRoutesDirectory}`,
    );
  }
  const configDefaults = await readConfigDefaults(
    path.dirname(absoluteAppDirectory),
  );
  const clientCacheDefault =
    typeof clientCache === 'number'
      ? Math.max(0, clientCache)
      : configDefaults.clientCache;
  const minimumLoadingDefault =
    typeof minimumLoadingMs === 'number'
      ? Math.max(0, minimumLoadingMs)
      : configDefaults.minimumLoadingMs;
  const written = new Set<string>();
  const previous = generatedThisPass;
  generatedThisPass = written;
  collectedInterceptors = [];
  let routes: NessRoute[];
  let globalErrorLayout: string | undefined;
  try {
    routes = discoverDirectory({
      appDirectory: absoluteAppDirectory,
      routesDirectory: absoluteRoutesDirectory,
      generatedDirectory: absoluteGeneratedDirectory,
      directory: absoluteRoutesDirectory,
      root: true,
      clientCacheDefault,
      minimumLoadingDefault,
    });
    const localization = normalizeI18n(i18n);
    if (localization) createLocaleLayout(absoluteGeneratedDirectory);
    const globalErrorFile = findModule(absoluteRoutesDirectory, 'global-error');
    if (globalErrorFile)
      globalErrorLayout = createGlobalErrorLayout(
        absoluteGeneratedDirectory,
        globalErrorFile,
      );
    writeRouteTypes(absoluteAppDirectory, flattenRoutePaths(routes));
  } finally {
    generatedThisPass = previous;
    pruneGenerated(absoluteGeneratedDirectory, written);
  }

  const localization = normalizeI18n(i18n);
  if (localization) {
    const layoutFile = createLocaleLayout(absoluteGeneratedDirectory);
    const file = routeFile(absoluteAppDirectory, layoutFile);

    // `prefix-except-default` serves the default locale at the root, so it
    // gets no prefixed branch of its own — emitting one would publish every
    // page at two URLs.
    const prefixed = localization.locales.filter(
      locale =>
        !(isBareDefault(localization) && locale === localization.defaultLocale),
    );
    const branches: NessRoute[] = prefixed.map(locale => ({
      id: `ness__locale__${locale}`,
      path: locale,
      file,
      children: prefixRouteIds(routes, `locale/${locale}`),
    }));

    // With `prefix-except-default` the untranslated tree stays mounted at the
    // root, so existing URLs keep resolving after locales are introduced.
    routes = isBareDefault(localization) ? [...routes, ...branches] : branches;
  }

  // Outermost of all, so it catches what every locale branch and segment
  // boundary let through.
  if (globalErrorLayout) {
    routes = [
      {
        id: 'ness__global-error',
        file: routeFile(absoluteAppDirectory, globalErrorLayout),
        children: routes,
      },
    ];
  }

  return routes;
}

/**
 * Every intercepting route the application declared, resolved to the URL it
 * intercepts. Runs discovery the same way `nessRoutePaths` does, so the
 * table can never disagree with the tree that actually got routed.
 */
async function nessInterceptors(
  options: NessRoutesOptions = {},
): Promise<InterceptorEntry[]> {
  await nessRoutes(options);
  return [...collectedInterceptors];
}

/**
 * Every navigable page, as a full path pattern paired with the module that
 * serves it.
 *
 * Derived from the route tree rather than from a second walk of the disk, so
 * it cannot drift from what actually got routed. Pages only: a `route.ts`
 * resource has no `clientLoader` to warm and nothing to navigate to.
 *
 * This is what makes prefetching a framework concern instead of a table every
 * application has to hand-maintain — the framework already knows which module
 * answers which URL, and an application repeating that knowledge is a copy
 * that goes stale the first time someone adds a page.
 */
function flattenRoutePaths(
  routes: NessRoute[],
  parentPath = '',
): NessRoutePath[] {
  const flat: NessRoutePath[] = [];
  for (const route of routes) {
    const segment = route.index ? '' : (route.path ?? '');
    const joined = segment
      ? `${parentPath.replace(/\/$/, '')}/${segment}`
      : parentPath;
    const full = joined || '/';
    if (route.file && String(route.id).endsWith('__page')) {
      flat.push({
        id: route.id,
        path: full,
        file: route.file,
        ...(route.config ? { config: route.config } : {}),
        ...(route.prefetch ? { prefetch: route.prefetch } : {}),
        ...(route.staticParams ? { staticParams: route.staticParams } : {}),
      });
    }
    if (route.children?.length) {
      flat.push(...flattenRoutePaths(route.children, full));
    }
  }
  return flat;
}

async function nessRoutePaths(
  options: NessRoutesOptions = {},
): Promise<NessRoutePath[]> {
  return flattenRoutePaths(await nessRoutes(options));
}

/**
 * The static paths `prerender: true` must NOT touch: `route.ts` resources
 * that export no GET or HEAD. A prerender is a GET, and the generated
 * dispatcher answers one honestly — 405 — which React Router's prerenderer
 * treats as the build failure it would be anywhere else. The endpoint is not
 * wrong and the prerender is not wrong; they just have nothing to say to
 * each other, so the path is subtracted from the expansion of `true` rather
 * than either side bending.
 */
function collectNonPrerenderable(
  routes: NessRoute[],
  parentPath = '',
  blocked: string[] = [],
): string[] {
  for (const route of routes) {
    const segment = route.index ? '' : (route.path ?? '');
    const joined = segment
      ? `${parentPath.replace(/\/$/, '')}/${segment}`
      : parentPath;
    const full = joined || '/';
    if (
      String(route.id).endsWith('__resource') &&
      route.methods &&
      !route.methods.includes('GET') &&
      !route.methods.includes('HEAD')
    ) {
      blocked.push(full);
    }
    if (route.children?.length) {
      collectNonPrerenderable(route.children, full, blocked);
    }
  }
  return blocked;
}

async function nessNonPrerenderablePaths(
  options: NessRoutesOptions = {},
): Promise<string[]> {
  return collectNonPrerenderable(await nessRoutes(options));
}

/**
 * Declares every route pattern the application has, so `href()` can be checked
 * against it.
 *
 * Written as declaration merging rather than as an exported type: an
 * application calls `href` from `@nessframework/core` and gets its own routes
 * typed, without importing anything generated or naming the file at all.
 */
function writeRouteTypes(appDirectory: string, pages: NessRoutePath[]): void {
  const entries = pages
    .map(page => {
      const names = [...String(page.path).matchAll(/:([A-Za-z0-9_]+)/g)].map(
        match => match[1]!,
      );
      const params = String(page.path).includes('*')
        ? [...names, 'splat']
        : names;
      const shape = params.length
        ? `{ ${params.map(name => `${name}: string | number`).join('; ')} }`
        : 'Record<string, never>';
      return `    ${JSON.stringify(page.path)}: ${shape};`;
    })
    .join('\n');
  // Beside the application's own files rather than inside `.ness`, because
  // TypeScript skips dot-directories when it expands a wildcard `include` —
  // a declaration nobody's compiler reads is a declaration that does nothing.
  writeIfChanged(
    path.join(appDirectory, 'ness-routes.d.ts'),
    `// Generated by Ness.js. Do not edit.
import '@nessframework/core';

declare module '@nessframework/core' {
  interface NessRouteMap {
${entries}
  }
}
`,
  );
}

export {
  RESERVED_FILES,
  ROUTE_EXTENSIONS,
  SEGMENT_CONFIG,
  expandStaticParams,
  fillStaticPath,
  nessInterceptors,
  nessNonPrerenderablePaths,
  nessRoutePaths,
  nessRoutes,
  prefixRouteIds,
  segmentPath,
};
