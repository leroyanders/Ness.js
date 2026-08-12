import assert from 'node:assert/strict';
import test from 'node:test';
import { tailwind } from '../src/index.js';

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
  const build = tailwind().configEnvironment('client', {}, { command: 'build' });
  assert.equal(build.css.postcss.plugins.length, 2);

  const serve = tailwind().configEnvironment('client', {}, { command: 'serve' });
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
  assert.equal(client.css.postcss.plugins.length, ssr.css.postcss.plugins.length);
});
