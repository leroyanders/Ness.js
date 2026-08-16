import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { nessRoutePaths, nessRoutes } from '../src/routes.js';

function scaffold(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-segments-'));
  for (const [name, content] of Object.entries(files)) {
    const filename = path.join(root, 'app', 'routes', name);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, content);
  }
  return { root, appDirectory: path.join(root, 'app') };
}

const PAGE = 'export default function P() { return null; }\n';

test('a template wraps the segment’s children, keyed by history entry, and nothing deeper', async () => {
  const { root, appDirectory } = scaffold({
    'layout.tsx': PAGE,
    'template.tsx':
      'export default function T({children}) { return children; }\n',
    'page.tsx': PAGE,
    'feed/page.tsx': PAGE,
  });
  await nessRoutes({ appDirectory });
  const generated = path.join(appDirectory, '.ness', 'routes');
  const read = name => fs.readFileSync(path.join(generated, name), 'utf8');

  assert.match(read('root__page.tsx'), /key: location\.key/);
  assert.match(read('feed__layout.tsx'), /key: location\.key/);
  assert.doesNotMatch(read('feed__page.tsx'), /NessTemplate/);
  assert.doesNotMatch(read('root__layout.tsx'), /NessTemplate/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('sitemap, robots and manifest modules are published as the files they describe', async () => {
  const { root, appDirectory } = scaffold({
    'page.tsx': PAGE,
    'sitemap.ts': 'export default () => [{url: "https://x.dev/"}];\n',
    'robots.ts': 'export default () => ({rules: []});\n',
    'manifest.ts': 'export default () => ({name: "x"});\n',
  });
  const tree = await nessRoutes({ appDirectory });
  // No layout at the root, so the tree is the root segment's children.
  const paths = tree.map(child => child.path).filter(Boolean);
  assert.deepEqual(paths.sort(), [
    'manifest.webmanifest',
    'robots.txt',
    'sitemap.xml',
  ]);
  const wrapper = fs.readFileSync(
    path.join(appDirectory, '.ness', 'routes', 'root__sitemap.ts'),
    'utf8',
  );
  assert.match(wrapper, /createSitemap/);
  assert.match(wrapper, /export async function loader/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('a page’s revalidate and dynamic are read off the source, from either half of the route', async () => {
  const { root, appDirectory } = scaffold({
    'page.tsx': `${PAGE}export const revalidate = 60;\n`,
    'blog/[slug]/page.tsx': PAGE,
    'blog/[slug]/page.server.ts':
      'export const dynamic: string = "force-dynamic";\nexport async function loader() { return null; }\n',
    'about/page.tsx': PAGE,
  });
  const pages = await nessRoutePaths({ appDirectory });
  const byPath = Object.fromEntries(
    pages.map(page => [page.path, page.config]),
  );
  assert.deepEqual(byPath['/'], { revalidate: 60 });
  assert.deepEqual(byPath['/blog/:slug'], { dynamic: 'force-dynamic' });
  assert.equal(byPath['/about'], undefined);
  fs.rmSync(root, { recursive: true, force: true });
});

test('a wrapper for a route that no longer exists is removed, not left behind', async () => {
  const { root, appDirectory } = scaffold({
    'page.tsx': PAGE,
    'gone/page.tsx': PAGE,
  });
  await nessRoutes({ appDirectory });
  const generated = path.join(appDirectory, '.ness', 'routes');
  assert.ok(fs.existsSync(path.join(generated, 'gone__page.tsx')));

  fs.rmSync(path.join(appDirectory, 'routes', 'gone'), { recursive: true });
  await nessRoutes({ appDirectory });
  assert.equal(fs.existsSync(path.join(generated, 'gone__page.tsx')), false);
  assert.ok(fs.existsSync(path.join(generated, 'root__page.tsx')));
  fs.rmSync(root, { recursive: true, force: true });
});
