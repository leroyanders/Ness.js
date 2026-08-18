import assert from 'node:assert/strict';
import test from 'node:test';
import env, { validateEnvironment } from '../dist/index.js';

test('environment validation accepts required, pattern, and choice rules', () => {
  const values = validateEnvironment(
    {
      DATABASE_URL: { required: true, pattern: /^postgres/ },
      NODE_ENV: { choices: ['test', 'production'] },
    },
    { DATABASE_URL: 'postgres://localhost/ness', NODE_ENV: 'test' },
  );
  assert.equal(values.NODE_ENV, 'test');
});

test('environment validation reports keys without exposing secret values', () => {
  assert.throws(
    () =>
      validateEnvironment(
        { API_SECRET: { required: true, pattern: /^safe-/ } },
        { API_SECRET: 'do-not-print-this' },
      ),
    error => {
      assert.match(error.message, /API_SECRET/);
      assert.doesNotMatch(error.message, /do-not-print-this/);
      return true;
    },
  );
});

test('env validates values in the Vite resolved config hook', () => {
  const variable = 'NESS_PLUGIN_TEST_REQUIRED_VALUE';
  const plugin = env({ schema: { [variable]: true } });
  assert.throws(
    () => plugin.configResolved({ env: {}, mode: 'test' }),
    new RegExp(variable),
  );
  assert.doesNotThrow(() =>
    env({ schema: { [variable]: true } }).configResolved({
      env: { [variable]: 'configured' },
    }),
  );
});
