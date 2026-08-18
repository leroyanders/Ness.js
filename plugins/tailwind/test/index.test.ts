import assert from 'node:assert/strict';
import test from 'node:test';
import { tailwind } from '../dist/index.js';

test('config: adds cssnano only for production builds', () => {
  const build = tailwind().config({}, { command: 'build' });
  assert.equal(build.css.postcss.plugins.length, 2);

  const serve = tailwind().config({}, { command: 'serve' });
  assert.equal(serve.css.postcss.plugins.length, 1);
});

test('config: minify overrides the command-derived default', () => {
  const forced = tailwind({ minify: true }).config({}, { command: 'serve' });
  assert.equal(forced.css.postcss.plugins.length, 2);

  const disabled = tailwind({ minify: false }).config({}, { command: 'build' });
  assert.equal(disabled.css.postcss.plugins.length, 1);
});

test('configEnvironment: adds cssnano only for production builds', () => {
  const build = tailwind().configEnvironment(
    'client',
    {},
    { command: 'build' },
  );
  assert.equal(build.css.postcss.plugins.length, 2);

  const serve = tailwind().configEnvironment(
    'client',
    {},
    { command: 'serve' },
  );
  assert.equal(serve.css.postcss.plugins.length, 1);
});

test('configEnvironment: minify overrides the command-derived default', () => {
  const forced = tailwind({ minify: true }).configEnvironment(
    'client',
    {},
    { command: 'serve' },
  );
  assert.equal(forced.css.postcss.plugins.length, 2);

  const disabled = tailwind({ minify: false }).configEnvironment(
    'client',
    {},
    { command: 'build' },
  );
  assert.equal(disabled.css.postcss.plugins.length, 1);
});

test('configEnvironment: applies the same postcss pipeline to every environment', () => {
  const plugin = tailwind();
  const client = plugin.configEnvironment('client', {}, { command: 'build' });
  const ssr = plugin.configEnvironment('ssr', {}, { command: 'build' });
  assert.equal(
    client.css.postcss.plugins.length,
    ssr.css.postcss.plugins.length,
  );
});

// `@import 'tailwindcss'` in the app's CSS makes Vite auto-insert its own
// postcss-import ahead of the plugins configured here, which asks the ssr
// environment to resolve the bare specifier `tailwindcss`. Left externalized
// (Vite's default for ssr — correct for JS `import`, meaningless for a CSS
// `@import`), that resolution hands back the bare string itself, which
// postcss-import then reads as a literal path from `cwd` and fails with
// ENOENT. `noExternal` is what makes the ssr environment resolve it to a
// real file instead, same as the client environment already does by default.
test('config: forces tailwindcss to resolve for ssr instead of externalizing', () => {
  const config = tailwind().config({}, { command: 'build' });
  assert.deepEqual(config.ssr.noExternal, ['tailwindcss']);
});

test('configEnvironment: forces tailwindcss to resolve for ssr instead of externalizing', () => {
  const plugin = tailwind();
  const ssr = plugin.configEnvironment('ssr', {}, { command: 'build' });
  assert.deepEqual(ssr.resolve.noExternal, ['tailwindcss']);

  const client = plugin.configEnvironment('client', {}, { command: 'build' });
  assert.equal(client.resolve, undefined);
});
