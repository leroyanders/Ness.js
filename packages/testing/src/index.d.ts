import { createRoutesStub } from 'react-router';
import type { NessCache } from '@nessframework/cache';
export { createRoutesStub };
export function createTestRequest(
  pathname?: string,
  init?: RequestInit,
): Request;
export function createTestCache(options?: { clock?: () => number }): NessCache;
export function assertResponse(
  response: Response,
  expected?: {
    status?: number;
    headers?: Record<string, string>;
    json?: unknown;
    text?: string;
  },
): Promise<Response>;
export function createVitestConfig(
  options?: Record<string, unknown>,
): Record<string, unknown>;
export function createPlaywrightConfig(
  options?: Record<string, unknown>,
): Record<string, unknown>;
