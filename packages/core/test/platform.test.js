import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSerializable, experimentalRsc } from '../src/rsc/index.js';
import { assertResponse, createTestRequest } from '../src/testing/index.js';

test('RSC helpers validate boundaries and expose the experimental feature flag', () => {
  assert.deepEqual(experimentalRsc({ mode: 'framework' }), {
    rsc: true,
    feature: 'experimental-rsc',
    mode: 'framework',
  });
  const value = { items: [1, 'two'] };
  assert.equal(assertSerializable(value), value);
  assert.throws(
    () => assertSerializable({ callback() {} }),
    /contains a function/,
  );
});

test('testing helpers create Web requests and assert responses', async () => {
  const request = createTestRequest('/api?test=1');
  assert.equal(request.url, 'http://ness.test/api?test=1');
  await assertResponse(Response.json({ ok: true }, { status: 201 }), {
    status: 201,
    json: { ok: true },
  });
});
