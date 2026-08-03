import assert from 'node:assert/strict';
import test from 'node:test';
import { install, tailwind } from '../src/index.js';

test('tailwind configures PostCSS for Vite builds', () => {
  const config = tailwind().config({}, { command: 'build' });
  assert.equal(config.css.postcss.plugins.length, 2);
});

test('tailwind configures the legacy PostCSS loader', () => {
  const loader = { loader: 'postcss-loader', options: {} };
  const config = {
    module: { rules: [{ use: [loader] }] },
  };
  install(config, { target: 'web', dev: true });
  assert.equal(loader.options.postcssOptions.plugins.length, 1);
});
