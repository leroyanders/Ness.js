import assert from 'node:assert/strict';
import test from 'node:test';
import { nessVitePlugin } from '../dist/vite/index.js';

/**
 * Drives the plugin's transform hook the way the build does, with a plugin
 * context reduced to what the hook actually touches.
 */
async function run(
  code,
  { id = '/proj/app/lib/data.server.ts', ssr = true } = {},
) {
  const plugin = nessVitePlugin({ root: '/proj' });
  const warnings = [];
  const context = {
    environment: { name: ssr ? 'ssr' : 'client' },
    error(message) {
      throw new Error(String(message));
    },
    warn(message) {
      warnings.push(String(message));
    },
  };
  const result = await plugin.transform.call(context, code, id, { ssr });
  return { code: result?.code ?? null, warnings };
}

test('a function-level directive wraps the export through __nessUseCache', async () => {
  const { code } = await run(
    [
      'export async function getPosts(limit: number) {',
      "  'use cache';",
      '  return limit;',
      '}',
    ].join('\n'),
  );
  assert.match(
    code,
    /import \{__nessUseCache\} from '@nessframework\/cache\/use-cache';/,
  );
  assert.match(
    code,
    /getPosts = __nessUseCache\(getPosts, "app\/lib\/data\.server\.ts#getPosts"\)/,
  );
});

test('a const arrow with the directive is wrapped in place', async () => {
  const { code } = await run(
    [
      'export const getUser = async (id: string) => {',
      "  'use cache';",
      '  return id;',
      '};',
    ].join('\n'),
  );
  assert.match(code, /getUser = __nessUseCache\(async \(id: string\) =>/);
  assert.match(code, /#getUser"\)/);
});

test('a module-level directive covers every exported function', async () => {
  const { code } = await run(
    [
      "'use cache';",
      'export async function first() { return 1; }',
      'export const second = async () => 2;',
      'async function helper() { return 3; }',
    ].join('\n'),
  );
  assert.match(code, /first = __nessUseCache\(first/);
  assert.match(code, /second = __nessUseCache\(/);
  // Unexported helpers are the module's own business.
  assert.doesNotMatch(code, /helper = __nessUseCache/);
});

test('a module without the directive is left alone', async () => {
  const { code } = await run('export async function plain() { return 1; }');
  assert.equal(code, null);
});

test('a synchronous use-cache function is a build error', async () => {
  await assert.rejects(
    run(
      ['export function sync() {', "  'use cache';", '  return 1;', '}'].join(
        '\n',
      ),
    ),
    /must be async/,
  );
});

test('the directive in a client bundle is a build error', async () => {
  await assert.rejects(
    run(
      [
        'export async function leak() {',
        "  'use cache';",
        '  return 1;',
        '}',
      ].join('\n'),
      { id: '/proj/app/lib/data.ts', ssr: false },
    ),
    /cannot be bundled for the client/,
  );
});
