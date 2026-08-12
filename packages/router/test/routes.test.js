import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { nessRoutes } from '../src/routes.js';

function scaffold() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-routes-'));
  const appDirectory = path.join(root, 'app');
  const routesDirectory = path.join(appDirectory, 'routes');
  fs.mkdirSync(routesDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(routesDirectory, 'page.tsx'),
    'export default function Home() { return null; }\n',
  );
  return { root, appDirectory, routesDirectory };
}

/**
 * A wrapper snapshots which exports its page.server file had when it was
 * generated. The dev server regenerates on change (see the vite plugin's
 * configureServer), which is only sound if a re-run actually refreshes the
 * wrapper — this pins that behaviour.
 */
test('re-running nessRoutes picks up new page.server exports', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    const serverFile = path.join(routesDirectory, 'page.server.ts');
    fs.writeFileSync(serverFile, 'export async function loader() { return null; }\n');

    await nessRoutes({ appDirectory });
    const wrapper = path.join(appDirectory, '.ness', 'routes', 'root__page.tsx');
    assert.match(fs.readFileSync(wrapper, 'utf8'), /export \{loader\}/);
    assert.doesNotMatch(fs.readFileSync(wrapper, 'utf8'), /action/);

    fs.appendFileSync(serverFile, 'export async function action() { return null; }\n');
    await nessRoutes({ appDirectory });
    assert.match(fs.readFileSync(wrapper, 'utf8'), /export \{loader, action\}/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('adding a route directory changes the returned tree', async () => {
  const { root, appDirectory, routesDirectory } = scaffold();
  try {
    const before = JSON.stringify(await nessRoutes({ appDirectory }));

    const nested = path.join(routesDirectory, 'settings');
    fs.mkdirSync(nested);
    fs.writeFileSync(
      path.join(nested, 'page.tsx'),
      'export default function Settings() { return null; }\n',
    );
    const after = JSON.stringify(await nessRoutes({ appDirectory }));

    assert.notEqual(after, before);
    assert.match(after, /settings/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
