import assert from 'node:assert/strict';
import test from 'node:test';
import security, { securityHeaders } from '../dist/index.js';

test('security creates visible defaults and supports overrides', () => {
  const headers = securityHeaders({
    contentSecurityPolicy: "default-src 'self'",
    headers: { 'X-Frame-Options': 'SAMEORIGIN' },
  });
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'SAMEORIGIN');
  assert.equal(headers['Content-Security-Policy'], "default-src 'self'");
});

test('security applies the headers to the dev server and to preview', () => {
  const vite = security().config();
  assert.equal(vite.server.headers['X-Frame-Options'], 'DENY');
  assert.equal(vite.preview.headers['X-Frame-Options'], 'DENY');
});

test('security omits a header that is explicitly disabled', () => {
  const headers = securityHeaders({ headers: { 'X-Frame-Options': false } });
  assert.equal('X-Frame-Options' in headers, false);
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
});
