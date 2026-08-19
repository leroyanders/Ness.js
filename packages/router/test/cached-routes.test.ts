import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { nessRoutePaths, nessRoutes } from '../dist/routes.js';

function scaffold() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-cached-routes-'));
  const appDirectory = path.join(root, 'app');
  const routesDirectory = path.join(appDirectory, 'routes');
  fs.mkdirSync(routesDirectory, { recursive: true });
  return { root, appDirectory, routesDirectory };
}

function wrapperOf(appDirectory, name = 'root__page.tsx') {
  return fs.readFileSync(
    path.join(appDirectory, '.ness', 'routes', name),
    'utf8',
  );
}

test('a page with clientCache but no loading.tsx gets the cached wrapper', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    fs.writeFileSync(
      path.join(routesDirectory, 'page.tsx'),
      'export const clientCache = 30;\nexport default function Home() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'page.server.ts'),
      'export async function loader() { return null; }\n',
    );

    await nessRoutes({ appDirectory });
    const wrapper = wrapperOf(appDirectory);
    assert.match(
      wrapper,
      /cacheRoute\(NessRoute, \{id: "root__page", serverLoader: true/,
    );
    assert.match(
      wrapper,
      /export const clientLoader = NessCached.clientLoader;/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a loader page without clientCache stays untouched when no default is set', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    fs.writeFileSync(
      path.join(routesDirectory, 'page.tsx'),
      'export default function Home() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'page.server.ts'),
      'export async function loader() { return null; }\n',
    );

    await nessRoutes({ appDirectory });
    const wrapper = wrapperOf(appDirectory);
    assert.doesNotMatch(wrapper, /cacheRoute/);
    assert.match(wrapper, /export \{loader\}/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('an application-wide clientCache wraps every loader page with the default baked in', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    fs.writeFileSync(
      path.join(routesDirectory, 'page.tsx'),
      'export default function Home() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'page.server.ts'),
      'export async function loader() { return null; }\n',
    );

    await nessRoutes({ appDirectory, clientCache: 45 });
    const wrapper = wrapperOf(appDirectory);
    assert.match(wrapper, /cacheRoute\(/);
    assert.match(wrapper, /defaultSeconds: 45/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the application default is read off ness.config.ts beside the app', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    fs.writeFileSync(
      path.join(root, 'ness.config.ts'),
      'export default { ness: { router: { clientCache: 30 } } };\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'page.tsx'),
      'export default function Home() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'page.server.ts'),
      'export async function loader() { return null; }\n',
    );

    await nessRoutes({ appDirectory });
    assert.match(wrapperOf(appDirectory), /defaultSeconds: 30/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a page without any loader is never wrapped, default or not', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    fs.writeFileSync(
      path.join(routesDirectory, 'page.tsx'),
      'export default function Home() { return null; }\n',
    );

    await nessRoutes({ appDirectory, clientCache: 45 });
    assert.doesNotMatch(wrapperOf(appDirectory), /cacheRoute/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a streamed route carries the application default too', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    fs.writeFileSync(
      path.join(routesDirectory, 'page.tsx'),
      'export default function Home() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'page.server.ts'),
      'export async function loader() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'loading.tsx'),
      'export default function Loading() { return null; }\n',
    );

    await nessRoutes({ appDirectory, clientCache: 45 });
    const wrapper = wrapperOf(appDirectory);
    assert.match(wrapper, /streamRoute\(/);
    assert.match(wrapper, /defaultSeconds: 45/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a streamed route bakes in the minimum loading stay', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    fs.writeFileSync(
      path.join(routesDirectory, 'page.tsx'),
      'export default function Home() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'page.server.ts'),
      'export async function loader() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'loading.tsx'),
      'export default function Loading() { return null; }\n',
    );

    await nessRoutes({ appDirectory, minimumLoadingMs: 1000 });
    const wrapper = wrapperOf(appDirectory);
    assert.match(wrapper, /streamRoute\(/);
    assert.match(wrapper, /minimumMs: 1000/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a cached route never carries the stay — there is no fallback to hold', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    fs.writeFileSync(
      path.join(routesDirectory, 'page.tsx'),
      'export const clientCache = 30;\nexport default function Home() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'page.server.ts'),
      'export async function loader() { return null; }\n',
    );

    await nessRoutes({ appDirectory, minimumLoadingMs: 1000 });
    const wrapper = wrapperOf(appDirectory);
    assert.match(wrapper, /cacheRoute\(/);
    assert.doesNotMatch(wrapper, /minimumMs/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('nessRoutePaths records what the prefetch layer needs', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    fs.writeFileSync(
      path.join(routesDirectory, 'page.tsx'),
      'export const clientCache = 30;\nexport default function Home() { return null; }\n',
    );
    fs.writeFileSync(
      path.join(routesDirectory, 'page.server.ts'),
      'export async function loader() { return null; }\n',
    );
    const about = path.join(routesDirectory, 'about');
    fs.mkdirSync(about);
    fs.writeFileSync(
      path.join(about, 'page.tsx'),
      'export default function About() { return null; }\n',
    );

    const pages = await nessRoutePaths({ appDirectory });
    const home = pages.find(page => page.path === '/');
    const aboutPage = pages.find(page => page.path === '/about');
    assert.deepEqual(home.prefetch, { serverLoader: true, wrapped: true });
    assert.deepEqual(aboutPage.prefetch, {
      serverLoader: false,
      wrapped: false,
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
