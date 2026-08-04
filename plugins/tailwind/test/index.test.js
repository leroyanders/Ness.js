import assert from 'node:assert/strict';
import test from 'node:test';
import { tailwind } from '../src/index.js';

test('tailwind adds cssnano only for production builds', () => {
  const build = tailwind().config({}, { command: 'build' });
  assert.equal(build.css.postcss.plugins.length, 2);

  const serve = tailwind().config({}, { command: 'serve' });
  assert.equal(serve.css.postcss.plugins.length, 1);
});

test('minify overrides the command-derived default', () => {
  const forced = tailwind({ minify: true }).config({}, { command: 'serve' });
  assert.equal(forced.css.postcss.plugins.length, 2);

  const disabled = tailwind({ minify: false }).config({}, { command: 'build' });
  assert.equal(disabled.css.postcss.plugins.length, 1);
});
