import assert from 'node:assert/strict';
import test from 'node:test';
import { expandVariables } from '../src/config/env.js';

test('environment expansion supports references and defaults', () => {
  assert.deepEqual(
    expandVariables({
      HOST: 'example.test',
      ORIGIN: 'https://${HOST}',
      FALLBACK: '${UNSET_NESS_VALUE:-enabled}',
    }),
    {
      HOST: 'example.test',
      ORIGIN: 'https://example.test',
      FALLBACK: 'enabled',
    },
  );
});
