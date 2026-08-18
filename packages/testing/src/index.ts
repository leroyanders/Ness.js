import assert from 'node:assert/strict';
import { createRoutesStub } from 'react-router';
import { MemoryCacheAdapter, NessCache } from '@nessframework/cache';
import '@nessframework/server/web-api';

export interface TestCacheOptions {
  clock?: () => number;
}

export interface ExpectedResponse {
  status?: number;
  headers?: Record<string, string>;
  json?: unknown;
  text?: string;
}

function createTestRequest(pathname = '/', init: RequestInit = {}): Request {
  return new Request(new URL(pathname, 'http://ness.test'), init);
}

function createTestCache(options?: TestCacheOptions): NessCache {
  const adapter = new MemoryCacheAdapter(options);
  return new NessCache(adapter, options);
}

async function assertResponse(
  response: Response,
  expected: ExpectedResponse = {},
): Promise<Response> {
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

function createVitestConfig(
  options: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    test: {
      environment: 'jsdom',
      setupFiles: [],
      restoreMocks: true,
      ...options,
    },
  };
}

function createPlaywrightConfig(
  options: Record<string, unknown> = {},
): Record<string, unknown> {
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
