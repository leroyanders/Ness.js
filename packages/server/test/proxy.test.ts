import assert from 'node:assert/strict';
import test from 'node:test';

import { applyForwardedHeaders } from '../dist/proxy.js';

function request(headers = {}, init = {}) {
  return new Request('http://internal-service:8080/checkout?step=2', {
    headers,
    ...init,
  });
}

test('the headers are ignored unless the proxy is trusted', () => {
  const original = request({
    'x-forwarded-proto': 'https',
    'x-forwarded-host': 'shop.example.com',
  });

  assert.equal(
    applyForwardedHeaders(original).url,
    'http://internal-service:8080/checkout?step=2',
    'a directly exposed server trusted a header the client can set',
  );
  assert.equal(
    applyForwardedHeaders(original, { trustProxy: false }).url,
    original.url,
  );
});

test('the scheme and host the visitor used are restored', () => {
  const forwarded = applyForwardedHeaders(
    request({
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'shop.example.com',
    }),
    { trustProxy: true },
  );

  assert.equal(forwarded.url, 'https://shop.example.com/checkout?step=2');
});

test('either header works on its own', () => {
  assert.equal(
    applyForwardedHeaders(request({ 'x-forwarded-proto': 'https' }), {
      trustProxy: true,
    }).url,
    'https://internal-service:8080/checkout?step=2',
  );
  assert.equal(
    applyForwardedHeaders(request({ 'x-forwarded-host': 'shop.example.com' }), {
      trustProxy: true,
    }).url,
    'http://shop.example.com/checkout?step=2',
  );
});

test('a chain of proxies is read from the client end', () => {
  const forwarded = applyForwardedHeaders(
    request({
      'x-forwarded-proto': 'https, http',
      'x-forwarded-host': 'shop.example.com, internal-lb',
    }),
    { trustProxy: true },
  );

  assert.equal(
    forwarded.url,
    'https://shop.example.com/checkout?step=2',
    'the value describing the visitor is the first, not the last',
  );
});

test('a scheme that is not http or https is refused', () => {
  for (const value of ['javascript', 'file', 'HTTPS://evil', '']) {
    const forwarded = applyForwardedHeaders(
      request({ 'x-forwarded-proto': value }),
      { trustProxy: true },
    );
    assert.match(
      forwarded.url,
      /^http:\/\/internal-service:8080\//,
      `${value} was accepted as a scheme`,
    );
  }
});

test('a host that is not a host is refused', () => {
  for (const value of [
    'shop.example.com/evil',
    'shop example.com',
    'http://shop.example.com',
    '',
  ]) {
    const forwarded = applyForwardedHeaders(
      request({ 'x-forwarded-host': value }),
      { trustProxy: true },
    );
    assert.equal(
      new URL(forwarded.url).host,
      'internal-service:8080',
      `${value} was accepted as a host`,
    );
  }
});

test('the case of the scheme does not matter', () => {
  assert.equal(
    applyForwardedHeaders(request({ 'x-forwarded-proto': 'HTTPS' }), {
      trustProxy: true,
    }).url,
    'https://internal-service:8080/checkout?step=2',
  );
});

test('the same request comes back when nothing needs correcting', () => {
  const original = request();
  assert.equal(applyForwardedHeaders(original, { trustProxy: true }), original);

  const matching = request({ 'x-forwarded-proto': 'http' });
  assert.equal(applyForwardedHeaders(matching, { trustProxy: true }), matching);
});

test('the method, headers and body survive the rewrite', async () => {
  const original = new Request('http://internal/checkout', {
    method: 'POST',
    headers: {
      'x-forwarded-proto': 'https',
      'content-type': 'application/json',
      cookie: 'sid=abc',
    },
    body: JSON.stringify({ items: 2 }),
  });

  const forwarded = applyForwardedHeaders(original, { trustProxy: true });

  assert.equal(forwarded.url, 'https://internal/checkout');
  assert.equal(forwarded.method, 'POST');
  assert.equal(forwarded.headers.get('cookie'), 'sid=abc');
  assert.deepEqual(await forwarded.json(), { items: 2 });
});

test('an explicit port in the forwarded host is kept', () => {
  const forwarded = applyForwardedHeaders(
    request({ 'x-forwarded-host': 'shop.example.com:8443' }),
    { trustProxy: true },
  );
  assert.equal(new URL(forwarded.url).port, '8443');
});

test('the internal port does not leak into the public URL', () => {
  const forwarded = applyForwardedHeaders(
    request({
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'shop.example.com',
    }),
    { trustProxy: true },
  );
  assert.equal(
    new URL(forwarded.url).port,
    '',
    'the internal :8080 was carried into a link the visitor would see',
  );
});
