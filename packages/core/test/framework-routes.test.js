import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { nessRoutes, segmentPath } from '../src/framework/routes.js';

const registerCleanup = (context, cleanup) => {
  if (typeof context.after === 'function') context.after(cleanup);
  else process.once('exit', cleanup);
};

test('route segments support dynamic, catch-all, group, and private conventions', () => {
  assert.equal(segmentPath('[slug]'), ':slug');
  assert.equal(segmentPath('[...parts]'), '*');
  assert.equal(segmentPath('(marketing)'), undefined);
  assert.equal(segmentPath('_private'), undefined);
});

test('Ness route discovery generates nested layouts, pages, resources, and boundaries', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-routes-'));
  registerCleanup(t, () => fs.rmSync(root, { recursive: true, force: true }));
  const app = path.join(root, 'app');
  const routes = path.join(app, 'routes');
  fs.mkdirSync(path.join(routes, 'blog', '[slug]'), { recursive: true });
  fs.writeFileSync(
    path.join(routes, 'page.tsx'),
    'export default function Home(){}',
  );
  fs.writeFileSync(
    path.join(routes, 'blog', 'layout.tsx'),
    'export default function Layout(){}',
  );
  fs.writeFileSync(
    path.join(routes, 'blog', 'error.tsx'),
    'export default function Error(){}',
  );
  fs.writeFileSync(
    path.join(routes, 'blog', 'forbidden.tsx'),
    'export default function Forbidden(){}',
  );
  fs.writeFileSync(
    path.join(routes, 'blog', 'middleware.ts'),
    'export default async function middleware(args, next){ return next(); }',
  );
  fs.writeFileSync(
    path.join(routes, 'blog', '[slug]', 'page.tsx'),
    'export default function Post(){}',
  );
  fs.writeFileSync(
    path.join(routes, 'blog', '[slug]', 'page.server.ts'),
    'export async function loader(){}',
  );
  fs.mkdirSync(path.join(routes, 'api', 'health'), { recursive: true });
  fs.writeFileSync(
    path.join(routes, 'api', 'health', 'route.ts'),
    'export async function GET(){}',
  );

  const config = await nessRoutes({
    appDirectory: app,
    routesDirectory: routes,
  });
  assert.ok(config.some(route => route.index));
  const blog = config.find(route => route.path === 'blog');
  assert.ok(blog);
  const post = blog.children.find(route => route.path === ':slug');
  assert.ok(post.children.some(route => route.index));
  const generated = fs.readFileSync(
    path.join(app, post.children[0].file),
    'utf8',
  );
  assert.match(generated, /page\.server/);
  const layout = fs.readFileSync(path.join(app, blog.file), 'utf8');
  assert.match(layout, /NessForbidden/);
  assert.match(layout, /middleware/);
  const api = config.find(route => route.path === 'api');
  const health = api.children.find(route => route.path === 'health');
  assert.ok(health);
  const resource = health.children.find(route => route.index);
  const resourceSource = fs.readFileSync(path.join(app, resource.file), 'utf8');
  assert.match(
    resourceSource,
    /RouteHandler\[request\.method\]|handlers\[request\.method\]/,
  );
  assert.match(resourceSource, /Method Not Allowed/);
});

test('a root route layout wraps the app and catch-all routes return 404', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-root-layout-'));
  registerCleanup(t, () => fs.rmSync(root, { recursive: true, force: true }));
  const app = path.join(root, 'app');
  const routes = path.join(app, 'routes');
  fs.mkdirSync(routes, { recursive: true });
  fs.writeFileSync(
    path.join(routes, 'layout.tsx'),
    'export default function Layout(){}',
  );
  fs.writeFileSync(
    path.join(routes, 'middleware.ts'),
    'export default async function middleware(args, next){ return next(); }',
  );
  fs.writeFileSync(
    path.join(routes, 'page.tsx'),
    'export default function Home(){}',
  );
  fs.writeFileSync(
    path.join(routes, 'not-found.tsx'),
    'export default function NotFound(){}',
  );

  const config = await nessRoutes({
    appDirectory: app,
    routesDirectory: routes,
  });
  assert.equal(config.length, 1);
  assert.equal(config[0].id, 'root__layout');
  assert.ok(config[0].children.some(route => route.index));
  const layout = fs.readFileSync(path.join(app, config[0].file), 'utf8');
  assert.match(layout, /middleware/);

  const notFound = config[0].children.find(route => route.path === '*');
  const notFoundSource = fs.readFileSync(path.join(app, notFound.file), 'utf8');
  assert.match(notFoundSource, /status: 404/);
});
