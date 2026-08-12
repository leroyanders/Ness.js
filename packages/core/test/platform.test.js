import assert from 'node:assert/strict';
import test from 'node:test';
import { cache } from 'react';
import {
  assertSerializable,
  requestCache,
  rscConfig,
} from '../src/rsc/index.js';
import { assertResponse, createTestRequest } from '../src/testing/index.js';

test('RSC helpers validate boundaries and expose the feature flag', () => {
  assert.deepEqual(rscConfig({ mode: 'framework' }), {
    rsc: true,
    feature: 'rsc',
    mode: 'framework',
  });
  const value = { items: [1, 'two'] };
  assert.equal(assertSerializable(value), value);
  assert.throws(
    () => assertSerializable({ callback() {} }),
    /contains a function/,
  );
});

test('requestCache is React 19 cache(), not @nessframework/cache', () => {
  // cache() only memoizes inside an actual render — this just confirms Ness
  // re-exports React's own function rather than wrapping it in something
  // that would change that render-scoped behavior.
  assert.equal(requestCache, cache);
  assert.equal(typeof requestCache(() => {}), 'function');
});

test('testing helpers create Web requests and assert responses', async () => {
  const request = createTestRequest('/api?test=1');
  assert.equal(request.url, 'http://ness.test/api?test=1');
  await assertResponse(Response.json({ ok: true }, { status: 201 }), {
    status: 201,
    json: { ok: true },
  });
});
