import assert from 'node:assert/strict';
import { createRoutesStub } from 'react-router';
import { MemoryCacheAdapter, NessCache } from '@nessframework/cache';
import '@nessframework/server/web-api';

function createTestRequest(pathname = '/', init = {}) {
  return new Request(new URL(pathname, 'http://ness.test'), init);
}

function createTestCache(options) {
  const adapter = new MemoryCacheAdapter(options);
  return new NessCache(adapter, options);
}

async function assertResponse(response, expected = {}) {
  assert.ok(response instanceof Response, 'Expected a Web Response.');
  if (expected.status !== undefined)
    assert.equal(response.status, expected.status);
  if (expected.headers) {
    for (const [name, value] of Object.entries(expected.headers))
      assert.equal(response.headers.get(name), value);
  }
  if (expected.json !== undefined)
    assert.deepEqual(await response.clone().json(), expected.json);
  if (expected.text !== undefined)
    assert.equal(await response.clone().text(), expected.text);
  return response;
}

function createVitestConfig(options = {}) {
  return {
    test: {
      environment: 'jsdom',
      setupFiles: [],
      restoreMocks: true,
      ...options,
    },
  };
}

function createPlaywrightConfig(options = {}) {
  return {
    testDir: './e2e',
    use: { baseURL: 'http://127.0.0.1:3000', trace: 'on-first-retry' },
    webServer: {
      command: 'npm run dev -- --port 3000',
      port: 3000,
      reuseExistingServer: true,
    },
    ...options,
  };
}

export {
  assertResponse,
  createPlaywrightConfig,
  createRoutesStub,
  createTestCache,
  createTestRequest,
  createVitestConfig,
};
