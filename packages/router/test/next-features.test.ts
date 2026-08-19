import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  expandStaticParams,
  fillStaticPath,
  nessInterceptors,
  nessNonPrerenderablePaths,
  nessRoutePaths,
  nessRoutes,
} from '../dist/routes.js';

function scaffold() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-next-'));
  const appDirectory = path.join(root, 'app');
  const routesDirectory = path.join(appDirectory, 'routes');
  fs.mkdirSync(routesDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(routesDirectory, 'page.tsx'),
    'export default function Home() { return null; }\n',
  );
  return { root, appDirectory, routesDirectory };
}

function wrapper(appDirectory, name) {
  return fs.readFileSync(
    path.join(appDirectory, '.ness', 'routes', name),
    'utf8',
  );
}

test('extended segment config is read off the page source', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.mkdirSync(path.join(routesDirectory, 'slow'));
  fs.writeFileSync(
    path.join(routesDirectory, 'slow', 'page.tsx'),
    [
      "export const runtime = 'edge';",
      'export const maxDuration = 30;',
      'export const dynamicParams = false;',
      "export const fetchCache = 'default-no-store';",
      "export const preferredRegion = 'fra1';",
      'export const experimental_ppr = true;',
      'export default function Slow() { return null; }',
    ].join('\n'),
  );
  const pages = await nessRoutePaths({ appDirectory });
  const slow = pages.find(page => page.path === '/slow');
  assert.deepEqual(slow.config, {
    runtime: 'edge',
    maxDuration: 30,
    dynamicParams: false,
    fetchCache: 'default-no-store',
    preferredRegion: 'fra1',
    ppr: true,
  });
});

test('a page with metadata gets tags rendered beside it', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.writeFileSync(
    path.join(routesDirectory, 'page.tsx'),
    "export const metadata = {title: 'Home'};\nexport default function Home() { return null; }\n",
  );
  await nessRoutes({ appDirectory });
  const generated = wrapper(appDirectory, 'root__page.tsx');
  assert.match(generated, /RouteMetadata/);
  assert.match(generated, /NessMetadataModule.metadata/);
  assert.match(generated, /export default NessWithMetadata/);
});

test('generateMetadata is wired with params and loader data', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.writeFileSync(
    path.join(routesDirectory, 'page.tsx'),
    'export async function generateMetadata({params}) { return {title: params.id}; }\nexport default function Home() { return null; }\n',
  );
  await nessRoutes({ appDirectory });
  const generated = wrapper(appDirectory, 'root__page.tsx');
  assert.match(generated, /NessMetadataModule.generateMetadata/);
  assert.match(generated, /loaderData: props\?\.loaderData/);
});

test('a layout with a static metadata template reaches its pages', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.writeFileSync(
    path.join(routesDirectory, 'layout.tsx'),
    "export const metadata = {title: {template: '%s | Site', default: 'Site'}};\nimport {Outlet} from 'react-router';\nexport default function Layout() { return <Outlet />; }\n",
  );
  fs.writeFileSync(
    path.join(routesDirectory, 'page.tsx'),
    "export const metadata = {title: 'Home'};\nexport default function Home() { return null; }\n",
  );
  await nessRoutes({ appDirectory });
  const page = wrapper(appDirectory, 'root__page.tsx');
  assert.match(page, /NessMetadataParent0/);
  assert.match(page, /parents=\{\[NessMetadataParent0.metadata\]\}/);
});

test('file metadata becomes imported assets and tags', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.writeFileSync(path.join(routesDirectory, 'icon.png'), 'png');
  fs.writeFileSync(path.join(routesDirectory, 'opengraph-image.png'), 'png');
  await nessRoutes({ appDirectory });
  const page = wrapper(appDirectory, 'root__page.tsx');
  assert.match(page, /FileMetadataTags/);
  assert.match(page, /icon\.png/);
  assert.match(page, /opengraph-image\.png/);
});

test('a dynamic opengraph-image module becomes a route', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.mkdirSync(path.join(routesDirectory, 'blog', '[slug]'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(routesDirectory, 'blog', '[slug]', 'page.tsx'),
    'export default function Post() { return null; }\n',
  );
  fs.writeFileSync(
    path.join(routesDirectory, 'blog', '[slug]', 'opengraph-image.tsx'),
    'export default function og() { return new Response("img"); }\n',
  );
  const routes = await nessRoutes({ appDirectory });
  const flat = JSON.stringify(routes);
  assert.match(flat, /"path":"opengraph-image"/);
  const page = wrapper(appDirectory, 'blog__slug____page.tsx');
  assert.match(page, /\/blog\/:slug\/opengraph-image/);
});

test('global-error wraps the whole tree', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.writeFileSync(
    path.join(routesDirectory, 'global-error.tsx'),
    'export default function GlobalError({error, reset}) { return null; }\n',
  );
  const routes = await nessRoutes({ appDirectory });
  assert.equal(routes.length, 1);
  assert.equal(routes[0].id, 'ness__global-error');
  assert.ok(routes[0].children.length > 0);
  const generated = wrapper(appDirectory, 'ness__global_error.tsx');
  assert.match(generated, /ErrorBoundary/);
  assert.match(generated, /reset/);
});

test('parallel route slots compose into the layout', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  const dashboard = path.join(routesDirectory, 'dashboard');
  fs.mkdirSync(path.join(dashboard, '@analytics'), { recursive: true });
  fs.mkdirSync(path.join(dashboard, '@team'), { recursive: true });
  fs.writeFileSync(
    path.join(dashboard, 'layout.tsx'),
    'export default function Layout({children, analytics, team}) { return null; }\n',
  );
  fs.writeFileSync(
    path.join(dashboard, 'page.tsx'),
    'export default function Dashboard() { return null; }\n',
  );
  fs.writeFileSync(
    path.join(dashboard, '@analytics', 'page.tsx'),
    'export default function Analytics() { return null; }\n',
  );
  fs.writeFileSync(
    path.join(dashboard, '@analytics', 'loading.tsx'),
    'export default function Loading() { return null; }\n',
  );
  fs.writeFileSync(
    path.join(dashboard, '@team', 'default.tsx'),
    'export default function TeamDefault() { return null; }\n',
  );
  await nessRoutes({ appDirectory });
  const layout = wrapper(appDirectory, 'dashboard__layout.tsx');
  assert.match(layout, /NessSlot_analytics/);
  assert.match(layout, /NessSlot_team/);
  assert.match(layout, /"analytics": <NessSlot_analytics/);
  const analytics = wrapper(appDirectory, 'dashboard__analytics__slot.tsx');
  assert.match(analytics, /SlotBoundary/);
  assert.match(analytics, /fallback=\{<NessSlotLoading \/>\}/);
  const team = wrapper(appDirectory, 'dashboard__team__slot.tsx');
  assert.match(team, /NessSlotContent/);
});

test('slots without a layout are refused', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  const broken = path.join(routesDirectory, 'broken');
  fs.mkdirSync(path.join(broken, '@side'), { recursive: true });
  fs.writeFileSync(
    path.join(broken, '@side', 'page.tsx'),
    'export default function Side() { return null; }\n',
  );
  fs.writeFileSync(
    path.join(broken, 'page.tsx'),
    'export default function Broken() { return null; }\n',
  );
  await assert.rejects(
    () => nessRoutes({ appDirectory }),
    /slots need a layout/,
  );
});

test('interceptors resolve their target against the tree', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  const feed = path.join(routesDirectory, 'feed');
  fs.mkdirSync(path.join(feed, '(..)photo', '[id]'), { recursive: true });
  fs.writeFileSync(
    path.join(feed, 'page.tsx'),
    'export default function Feed() { return null; }\n',
  );
  fs.writeFileSync(
    path.join(feed, '(..)photo', '[id]', 'page.tsx'),
    'export default function PhotoModal({params}) { return null; }\n',
  );
  // The real route the interceptor stands in for.
  fs.mkdirSync(path.join(routesDirectory, 'photo', '[id]'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(routesDirectory, 'photo', '[id]', 'page.tsx'),
    'export default function Photo() { return null; }\n',
  );
  const interceptors = await nessInterceptors({ appDirectory });
  assert.equal(interceptors.length, 1);
  assert.equal(interceptors[0].from, '/feed');
  assert.equal(interceptors[0].pattern, '/photo/:id');
  assert.match(interceptors[0].file, /\(\.\.\)photo/);
  // Interceptor pages never become routes of their own.
  const pages = await nessRoutePaths({ appDirectory });
  assert.ok(!pages.some(page => page.path.includes('(..)')));
});

test('an interceptor inside a slot resolves the same way', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  const gallery = path.join(routesDirectory, 'gallery');
  fs.mkdirSync(path.join(gallery, '@modal', '(.)image', '[id]'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(gallery, 'layout.tsx'),
    'export default function Layout({children, modal}) { return null; }\n',
  );
  fs.writeFileSync(
    path.join(gallery, 'page.tsx'),
    'export default function Gallery() { return null; }\n',
  );
  fs.writeFileSync(
    path.join(gallery, '@modal', 'default.tsx'),
    'export default function Empty() { return null; }\n',
  );
  fs.writeFileSync(
    path.join(gallery, '@modal', '(.)image', '[id]', 'page.tsx'),
    'export default function ImageModal({params}) { return null; }\n',
  );
  const interceptors = await nessInterceptors({ appDirectory });
  assert.equal(interceptors.length, 1);
  assert.equal(interceptors[0].from, '/gallery');
  assert.equal(interceptors[0].pattern, '/gallery/image/:id');
});

test('a page with a viewport export gets viewport tags rendered beside it', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.writeFileSync(
    path.join(routesDirectory, 'page.tsx'),
    "export const viewport = {width: 'device-width', initialScale: 1};\nexport default function Home() { return null; }\n",
  );
  await nessRoutes({ appDirectory });
  const generated = wrapper(appDirectory, 'root__page.tsx');
  assert.match(generated, /RouteViewport as NessRouteViewport/);
  assert.match(generated, /NessViewportModule\.viewport/);
});

test('generateViewport wires the same way', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.writeFileSync(
    path.join(routesDirectory, 'page.tsx'),
    'export async function generateViewport({params}) { return {}; }\nexport default function Home() { return null; }\n',
  );
  await nessRoutes({ appDirectory });
  const generated = wrapper(appDirectory, 'root__page.tsx');
  assert.match(generated, /NessViewportModule\.generateViewport/);
});

test('middleware with a matcher config is wrapped through matchedMiddleware', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.mkdirSync(path.join(routesDirectory, 'admin'));
  fs.writeFileSync(
    path.join(routesDirectory, 'admin', 'layout.tsx'),
    'export default function Layout({children}) { return children; }\n',
  );
  fs.writeFileSync(
    path.join(routesDirectory, 'admin', 'page.tsx'),
    'export default function Admin() { return null; }\n',
  );
  fs.writeFileSync(
    path.join(routesDirectory, 'admin', 'middleware.ts'),
    "export const config = {matcher: '/admin/:path*'};\nexport default async function guard({request}, next) { return next(); }\n",
  );
  await nessRoutes({ appDirectory });
  const generated = wrapper(appDirectory, 'admin__layout.tsx');
  assert.match(generated, /matchedMiddleware/);
  assert.match(generated, /NessMiddlewareConfig/);
});

test('middleware without a matcher keeps the plain array export', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.writeFileSync(
    path.join(routesDirectory, 'middleware.ts'),
    'export default async function guard({request}, next) { return next(); }\n',
  );
  fs.writeFileSync(
    path.join(routesDirectory, 'layout.tsx'),
    'export default function Layout({children}) { return children; }\n',
  );
  await nessRoutes({ appDirectory });
  const generated = wrapper(appDirectory, 'root__layout.tsx');
  assert.match(generated, /Array\.isArray\(NessMiddleware\)/);
  assert.doesNotMatch(generated, /matchedMiddleware/);
});

test('generateStaticParams is detected and recorded on the page', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  const blog = path.join(routesDirectory, 'blog', '[slug]');
  fs.mkdirSync(blog, { recursive: true });
  fs.writeFileSync(
    path.join(blog, 'page.tsx'),
    'export default function Post({params}) { return null; }\n',
  );
  fs.writeFileSync(
    path.join(blog, 'page.server.ts'),
    "export async function generateStaticParams() { return [{slug: 'one'}, {slug: 'two'}]; }\n",
  );
  const pages = await nessRoutePaths({ appDirectory });
  const post = pages.find(page => page.path === '/blog/:slug');
  assert.ok(post.staticParams.endsWith('page.server.ts'));
});

test('expandStaticParams turns param sets into concrete paths', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  const blog = path.join(routesDirectory, 'blog', '[slug]');
  fs.mkdirSync(blog, { recursive: true });
  fs.writeFileSync(
    path.join(blog, 'page.tsx'),
    'export default function Post({params}) { return null; }\n',
  );
  fs.writeFileSync(
    path.join(blog, 'page.server.ts'),
    "export async function generateStaticParams() { return [{slug: 'one'}, {slug: 'two'}]; }\n",
  );
  const pages = await nessRoutePaths({ appDirectory });
  const expanded = await expandStaticParams(pages);
  assert.deepEqual(expanded.sort(), ['/blog/one', '/blog/two']);
});

test('fillStaticPath substitutes params and joins catch-alls', () => {
  assert.equal(fillStaticPath('/blog/:slug', { slug: 'hello' }), '/blog/hello');
  assert.equal(
    fillStaticPath('/docs/*', { slug: ['guides', 'intro'] }),
    '/docs/guides/intro',
  );
  assert.equal(fillStaticPath('/blog/:slug', {}), undefined);
});

test('an image module with generateImageMetadata dispatches by id', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  fs.writeFileSync(
    path.join(routesDirectory, 'opengraph-image.tsx'),
    [
      'export async function generateImageMetadata({params}) {',
      "  return [{id: 'small', contentType: 'image/png'}, {id: 'large'}];",
      '}',
      'export default async function Image({params, id}) { return new Response(id); }',
    ].join('\n'),
  );
  await nessRoutes({ appDirectory });
  const generated = wrapper(appDirectory, 'root__opengraph_image.ts');
  assert.match(generated, /generateImageMetadata/);
  assert.match(generated, /searchParams\.get\('id'\)/);
});

test('a POST-only route.ts is named non-prerenderable', async () => {
  const { appDirectory, routesDirectory } = scaffold();
  const session = path.join(routesDirectory, 'auth-session');
  fs.mkdirSync(session);
  fs.writeFileSync(
    path.join(session, 'route.ts'),
    'export async function POST(request) { return new Response("ok"); }\n',
  );
  const api = path.join(routesDirectory, 'api', 'health');
  fs.mkdirSync(api, { recursive: true });
  fs.writeFileSync(
    path.join(api, 'route.ts'),
    'export async function GET() { return Response.json({ok: true}); }\n',
  );
  const blocked = await nessNonPrerenderablePaths({ appDirectory });
  assert.deepEqual(blocked, ['/auth-session']);
});
