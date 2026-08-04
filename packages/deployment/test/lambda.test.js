import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLambdaHandler,
  eventFromResponse,
  requestFromEvent,
} from '../src/lambda.js';

function event(overrides = {}) {
  return {
    rawPath: '/products',
    rawQueryString: 'page=2',
    headers: { host: 'ness.dev', 'x-forwarded-proto': 'https' },
    requestContext: { http: { method: 'GET' } },
    ...overrides,
  };
}

test('an API Gateway v2 event becomes a Web Request', () => {
  const request = requestFromEvent(event());
  assert.equal(request.url, 'https://ness.dev/products?page=2');
  assert.equal(request.method, 'GET');
  assert.equal(request.headers.get('host'), 'ness.dev');
});

test('cookies are folded into the cookie header', () => {
  const request = requestFromEvent(
    event({ cookies: ['session=abc', 'theme=dark'] }),
  );
  assert.match(request.headers.get('cookie'), /session=abc/);
  assert.match(request.headers.get('cookie'), /theme=dark/);
});

test('a base64 body is decoded', async () => {
  const request = requestFromEvent(
    event({
      requestContext: { http: { method: 'POST' } },
      body: Buffer.from('{"ok":true}').toString('base64'),
      isBase64Encoded: true,
    }),
  );
  assert.deepEqual(await request.json(), { ok: true });
});

test('x-forwarded-host wins over host, so a proxied URL is correct', () => {
  const request = requestFromEvent(
    event({
      headers: { host: 'internal.aws', 'x-forwarded-host': 'ness.dev' },
    }),
  );
  assert.match(request.url, /^https:\/\/ness\.dev\//);
});

test('an unsupported payload fails with a message naming the reason', () => {
  assert.throws(() => requestFromEvent({ rawPath: '/' }), /API Gateway v2/);
});

test('a text response is returned as UTF-8, not base64', async () => {
  const result = await eventFromResponse(
    new Response('<h1>Hi</h1>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  );
  assert.equal(result.statusCode, 200);
  assert.equal(result.isBase64Encoded, false);
  assert.equal(result.body, '<h1>Hi</h1>');
});

test('a binary response is base64 encoded', async () => {
  const bytes = new Uint8Array([137, 80, 78, 71]);
  const result = await eventFromResponse(
    new Response(bytes, { headers: { 'content-type': 'image/png' } }),
  );
  assert.equal(result.isBase64Encoded, true);
  assert.equal(Buffer.from(result.body, 'base64')[0], 137);
});

test('multiple Set-Cookie headers survive as separate cookies', async () => {
  const headers = new Headers();
  headers.append('set-cookie', 'a=1; Path=/');
  headers.append('set-cookie', 'b=2; Path=/');
  const result = await eventFromResponse(new Response('ok', { headers }));

  assert.equal(
    result.cookies.length,
    2,
    'folding them into one comma-joined header would corrupt both',
  );
  assert.equal(result.headers['set-cookie'], undefined);
});

test('the handler wires a request through to a Lambda result', async () => {
  const handler = createLambdaHandler(async request =>
    Response.json({ path: new URL(request.url).pathname }),
  );
  const result = await handler(event());

  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), { path: '/products' });
});

test('the handler rejects a non-function argument', () => {
  assert.throws(() => createLambdaHandler(undefined), /fetch handler/);
});
