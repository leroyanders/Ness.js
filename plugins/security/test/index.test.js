import assert from 'node:assert/strict';
import test from 'node:test';
import security, { install, securityHeaders } from '../src/index.js';

test('security creates visible defaults and supports overrides', () => {
  const headers = securityHeaders({
    contentSecurityPolicy: "default-src 'self'",
    headers: { 'X-Frame-Options': 'SAMEORIGIN' },
  });
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'SAMEORIGIN');
  assert.equal(headers['Content-Security-Policy'], "default-src 'self'");
});

test('security configures Vite and legacy development servers', () => {
  const vite = security().config();
  assert.equal(vite.server.headers['X-Frame-Options'], 'DENY');
  assert.equal(vite.preview.headers['X-Frame-Options'], 'DENY');

  const webpack = install({ devServer: { headers: { Custom: 'value' } } });
  assert.equal(webpack.devServer.headers.Custom, 'value');
  assert.equal(webpack.devServer.headers['X-Frame-Options'], 'DENY');
});
