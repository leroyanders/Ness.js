import fs from 'node:fs';
import path from 'node:path';
import { isBareDefault, normalizeI18n } from './i18n.js';

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
];

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
const SEGMENT_CONFIG = ['revalidate', 'dynamic'];

function slash(value) {
  return value.split(path.sep).join('/');
}

function findModule(directory, basename) {
  for (const extension of ROUTE_EXTENSIONS) {
    const filename = path.join(directory, `${basename}${extension}`);
    if (fs.existsSync(filename)) return filename;
  }
  return undefined;
}

function segmentPath(segment) {
  if (/^\(.+\)$/.test(segment) || segment.startsWith('_')) return undefined;
  const optionalCatchAll = segment.match(/^\[\[\.\.\.(.+)\]\]$/);
  if (optionalCatchAll) return '*';
  const catchAll = segment.match(/^\[\.\.\.(.+)\]$/);
  if (catchAll) return '*';
  const dynamic = segment.match(/^\[(.+)\]$/);
  if (dynamic) return `:${dynamic[1]}`;
  return segment;
}

function importPath(from, to) {
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
let generatedThisPass = null;

function writeIfChanged(filename, content) {
  generatedThisPass?.add(path.resolve(filename));
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  if (fs.existsSync(filename) && fs.readFileSync(filename, 'utf8') === content)
    return;
  fs.writeFileSync(filename, content);
}

/** Removes wrappers left over from routes that no longer exist. */
function pruneGenerated(generatedDirectory, written) {
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

function findAdjacentServer(generatedFile, sourceFile) {
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
 * Reads a segment's caching rules off its source: `export const revalidate =
 * 60`, `export const dynamic = 'force-dynamic'`.
 *
 * Statically, from the text, because the answer is needed where the module
 * cannot be run — at build time to write the manifest, and in a production
 * server that must decide whether a URL may be cached before it renders it.
 * A value that is not a literal is not configuration; it is ignored, exactly
 * as Next ignores one it cannot see.
 */
function findSegmentConfig(source) {
  const config = {};
  const revalidate = source.match(
    /\bexport\s+const\s+revalidate\s*(?::[^=]+)?=\s*(\d+|false)\b/,
  );
  if (revalidate)
    config.revalidate =
      revalidate[1] === 'false' ? false : Number(revalidate[1]);
  const dynamic = source.match(
    /\bexport\s+const\s+dynamic\s*(?::[^=]+)?=\s*['"`](force-dynamic|force-static|auto)['"`]/,
  );
  if (dynamic) config.dynamic = dynamic[1];
  return Object.keys(config).length ? config : undefined;
}

function findNamedExports(source) {
  const names = new Set();
  for (const match of source.matchAll(
    /\bexport\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
    for (const declaration of match[1].split(',')) {
      const parts = declaration.trim().split(/\s+as\s+/);
      const name = parts.at(-1)?.trim();
      if (name && name !== 'default' && /^[A-Za-z_$][\w$]*$/.test(name))
        names.add(name);
    }
  }
  return [...names];
}

function appendBoundary(
  lines,
  generatedFile,
  { errorFile, notFoundFile, forbiddenFile, unauthorizedFile },
) {
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
  lines,
  { generatedFile, modulePath, boundaryFile, routeId, namedExports, server },
) {
  const userShouldRevalidate = namedExports.includes('shouldRevalidate')
    ? 'NessRoute.shouldRevalidate'
    : server.exports.includes('shouldRevalidate')
      ? 'NessServerRoute.shouldRevalidate'
      : 'undefined';
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
    `const NessStreamed = streamRoute(NessRoute, NessLoading, {id: ${JSON.stringify(routeId)}, serverLoader: ${server.exports.includes('loader') || namedExports.includes('loader')}, shouldRevalidate: ${userShouldRevalidate}});`,
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
function appendTemplate(lines, { generatedFile, templateFile }) {
  lines.push(
    `import NessTemplate from ${JSON.stringify(importPath(generatedFile, templateFile))};`,
  );
  lines.push("import {useLocation as nessUseLocation} from 'react-router';");
  lines.push("import {createElement as nessCreateElement} from 'react';");
  lines.push(
    'function NessTemplated(props){\n' +
      '  const location = nessUseLocation();\n' +
      '  return nessCreateElement(NessTemplate, {key: location.key}, nessCreateElement(NessComponent, props));\n' +
      '}',
  );
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
}) {
  const lines = ['// Generated by Ness.js. Do not edit.'];
  let namedExports = [];
  let serverExports = [];
  let streamed = false;
  if (sourceFile) {
    const modulePath = JSON.stringify(importPath(generatedFile, sourceFile));
    const source = fs.readFileSync(sourceFile, 'utf8');
    namedExports = findNamedExports(source);
    const server = findAdjacentServer(generatedFile, sourceFile);
    serverExports = server.exports;
    // Nothing to wait for means nothing to show a fallback for: a route
    // without a loader is emitted exactly as it always was, so a `loading.tsx`
    // costs nothing where there is no data.
    const hasLoader =
      namedExports.includes('clientLoader') ||
      namedExports.includes('loader') ||
      serverExports.includes('loader');
    streamed = Boolean(boundaryFile) && hasLoader;
    if (streamed) {
      appendStreamedRoute(lines, {
        generatedFile,
        modulePath,
        boundaryFile,
        routeId,
        namedExports,
        server,
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
    if (templateFile) {
      appendTemplate(lines, { generatedFile, templateFile });
      lines.push('export default NessTemplated;');
    } else {
      lines.push('export default NessComponent;');
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
  if (middlewareFile) {
    lines.push(
      `import NessMiddleware from ${JSON.stringify(importPath(generatedFile, middlewareFile))};`,
    );
    lines.push(
      'export const middleware = Array.isArray(NessMiddleware) ? NessMiddleware : [NessMiddleware];',
    );
  }
  writeIfChanged(generatedFile, `${lines.join('\n')}\n`);
}

function createResourceWrapper({ generatedFile, sourceFile, middlewareFile }) {
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
  const middlewareImport = middlewareFile
    ? `import NessMiddleware from ${JSON.stringify(importPath(generatedFile, middlewareFile))};`
    : '';
  const middlewareExport = middlewareFile
    ? 'export const middleware = Array.isArray(NessMiddleware) ? NessMiddleware : [NessMiddleware];'
    : '';
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
 * A `sitemap`/`robots`/`manifest` module, published as the file it describes.
 *
 * The application exports a default function returning ordinary data; the
 * serialization — the XML, the content type, the escaping — is the
 * framework's, because getting it wrong is silent and every project would
 * otherwise write it again.
 */
function createMetadataWrapper({ generatedFile, sourceFile, serializer }) {
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

/** A page's own config, or its `.server` module's — whichever declares it. */
function segmentConfigFor(sourceFile) {
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

function moduleId(routesDirectory, directory, suffix) {
  const relative = slash(path.relative(routesDirectory, directory)) || 'root';
  return `${relative.replace(/[^a-zA-Z0-9_-]+/g, '__')}__${suffix}`;
}

function routeFile(appDirectory, generatedFile) {
  return slash(path.relative(appDirectory, generatedFile));
}

function discoverDirectory({
  appDirectory,
  routesDirectory,
  generatedDirectory,
  directory,
  root = false,
  inheritedLoadingFile,
  parentTemplateFile,
}) {
  const layoutFile = findModule(directory, 'layout');
  const pageFile = findModule(directory, 'page');
  const resourceFile = findModule(directory, 'route');
  const errorFile = findModule(directory, 'error');
  const loadingFile = findModule(directory, 'loading');
  const middlewareFile = findModule(directory, 'middleware');
  const notFoundFile = findModule(directory, 'not-found');
  const forbiddenFile = findModule(directory, 'forbidden');
  const unauthorizedFile = findModule(directory, 'unauthorized');
  if (pageFile && resourceFile) {
    throw new Error(
      `A Ness route cannot contain both page and route modules: ${directory}`,
    );
  }

  // A segment's `loading.tsx` covers what the segment renders *inside* its own
  // layout — its page and everything nested under it — and not the layout
  // itself, which belongs to the segment above. That one line is the whole
  // nesting rule: moving between two pages under the same layout replaces the
  // page area, and a navigation that reloads the layout falls back a level up.
  const childLoadingFile = loadingFile ?? inheritedLoadingFile;

  // A template belongs to its own segment's children and no deeper: one
  // instance in the tree, in the same position the boundary sits in.
  const templateFile = findModule(directory, 'template');

  const childDirectories = fs.existsSync(directory)
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
  const children = [];

  if (pageFile) {
    const generatedFile = path.join(
      generatedDirectory,
      `${moduleId(routesDirectory, directory, 'page')}.tsx`,
    );
    const segmentConfig = segmentConfigFor(pageFile);
    createWrapper({
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
    });
    children.push({
      id: moduleId(routesDirectory, directory, 'page'),
      index: true,
      file: routeFile(appDirectory, generatedFile),
      ...(segmentConfig ? { config: segmentConfig } : {}),
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
    });
  }

  for (const child of childDirectories) {
    const childRoute = discoverDirectory({
      appDirectory,
      routesDirectory,
      generatedDirectory,
      directory: path.join(directory, child.name),
      inheritedLoadingFile: childLoadingFile,
      parentTemplateFile: templateFile,
    });
    if (childRoute) children.push(childRoute);
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
  });
  const entry = {
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
function prefixRouteIds(routes, prefix) {
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
function createLocaleLayout(generatedDirectory) {
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

async function nessRoutes({
  appDirectory = path.join(process.cwd(), 'app'),
  routesDirectory = path.join(appDirectory, 'routes'),
  generatedDirectory = path.join(appDirectory, '.ness', 'routes'),
  i18n,
} = {}) {
  const absoluteAppDirectory = path.resolve(appDirectory);
  const absoluteRoutesDirectory = path.resolve(routesDirectory);
  const absoluteGeneratedDirectory = path.resolve(generatedDirectory);
  if (!fs.existsSync(absoluteRoutesDirectory)) {
    throw new Error(
      `Ness routes directory does not exist: ${absoluteRoutesDirectory}`,
    );
  }
  const written = new Set();
  const previous = generatedThisPass;
  generatedThisPass = written;
  let routes;
  try {
    routes = discoverDirectory({
      appDirectory: absoluteAppDirectory,
      routesDirectory: absoluteRoutesDirectory,
      generatedDirectory: absoluteGeneratedDirectory,
      directory: absoluteRoutesDirectory,
      root: true,
    });
    const localization = normalizeI18n(i18n);
    if (localization) createLocaleLayout(absoluteGeneratedDirectory);
    writeRouteTypes(
      absoluteAppDirectory,
      flattenRoutePaths(Array.isArray(routes) ? routes : [routes]),
    );
  } finally {
    generatedThisPass = previous;
    pruneGenerated(absoluteGeneratedDirectory, written);
  }

  const localization = normalizeI18n(i18n);
  if (!localization) return routes;

  const layoutFile = createLocaleLayout(absoluteGeneratedDirectory);
  const file = routeFile(absoluteAppDirectory, layoutFile);

  // `prefix-except-default` serves the default locale at the root, so it gets
  // no prefixed branch of its own — emitting one would publish every page at
  // two URLs.
  const prefixed = localization.locales.filter(
    locale =>
      !(isBareDefault(localization) && locale === localization.defaultLocale),
  );
  const branches = prefixed.map(locale => ({
    id: `ness__locale__${locale}`,
    path: locale,
    file,
    children: prefixRouteIds(routes, `locale/${locale}`),
  }));

  // With `prefix-except-default` the untranslated tree stays mounted at the
  // root, so existing URLs keep resolving after locales are introduced.
  return isBareDefault(localization) ? [...routes, ...branches] : branches;
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
function flattenRoutePaths(routes, parentPath = '') {
  const flat = [];
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
      });
    }
    if (route.children?.length) {
      flat.push(...flattenRoutePaths(route.children, full));
    }
  }
  return flat;
}

async function nessRoutePaths(options = {}) {
  return flattenRoutePaths(await nessRoutes(options));
}

/**
 * Declares every route pattern the application has, so `href()` can be checked
 * against it.
 *
 * Written as declaration merging rather than as an exported type: an
 * application calls `href` from `@nessframework/core` and gets its own routes
 * typed, without importing anything generated or naming the file at all.
 */
function writeRouteTypes(appDirectory, pages) {
  const entries = pages
    .map(page => {
      const names = [...String(page.path).matchAll(/:([A-Za-z0-9_]+)/g)].map(
        match => match[1],
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
  nessRoutePaths,
  nessRoutes,
  prefixRouteIds,
  segmentPath,
};
