import assert from 'node:assert/strict';
import test from 'node:test';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';

import {
  compressResponse,
  negotiateEncoding,
  shouldCompress,
} from '../src/compress.js';

const html = { 'content-type': 'text/html; charset=utf-8' };

function accepting(value) {
  return new Request('https://example.com/', {
    headers: value ? { 'accept-encoding': value } : {},
  });
}

async function bytes(response) {
  return Buffer.from(await response.arrayBuffer());
}

test('negotiateEncoding prefers brotli and falls back to gzip', () => {
  assert.equal(negotiateEncoding('br, gzip'), 'br');
  assert.equal(negotiateEncoding('gzip'), 'gzip');
  assert.equal(negotiateEncoding('gzip, deflate'), 'gzip');
  assert.equal(negotiateEncoding('deflate'), undefined);
  assert.equal(negotiateEncoding(''), undefined);
  assert.equal(negotiateEncoding(undefined), undefined);
});

test('negotiateEncoding honours quality values, including a refusal', () => {
  assert.equal(negotiateEncoding('br;q=0.1, gzip;q=0.9'), 'gzip');
  assert.equal(
    negotiateEncoding('br;q=0, gzip'),
    'gzip',
    'q=0 means "not this one", not "no preference"',
  );
  assert.equal(negotiateEncoding('br;q=0, gzip;q=0'), undefined);
  assert.equal(negotiateEncoding('*'), 'br');
});

test('shouldCompress skips what is already compressed or must not change', () => {
  assert.equal(
    shouldCompress(new Response('a'.repeat(2000), { headers: html })),
    true,
  );

  assert.equal(
    shouldCompress(
      new Response('a'.repeat(2000), {
        headers: { ...html, 'content-encoding': 'gzip' },
      }),
    ),
    false,
    'a response already encoded must not be encoded twice',
  );
  assert.equal(
    shouldCompress(
      new Response('a'.repeat(2000), {
        headers: { ...html, 'cache-control': 'public, no-transform' },
      }),
    ),
    false,
  );
  assert.equal(
    shouldCompress(
      new Response('a'.repeat(2000), {
        headers: { 'content-type': 'image/png' },
      }),
    ),
    false,
    'an image is already compressed; a second pass costs CPU and saves nothing',
  );
  assert.equal(
    shouldCompress(new Response(null, { status: 204, headers: html })),
    false,
  );
});

test('shouldCompress skips a small body but not one of unknown length', () => {
  const small = new Response('tiny', {
    headers: { ...html, 'content-length': '4' },
  });
  assert.equal(shouldCompress(small), false);

  const streamed = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('x'));
        controller.close();
      },
    }),
    { headers: html },
  );
  assert.equal(
    shouldCompress(streamed),
    true,
    'a streamed response is compressed rather than buffered to measure it',
  );
});

test('compressResponse produces bytes the client can actually decode', async () => {
  const original = '<html>' + 'content '.repeat(500) + '</html>';

  const brotli = compressResponse(
    accepting('br'),
    new Response(original, { headers: html }),
  );
  assert.equal(brotli.headers.get('content-encoding'), 'br');
  assert.equal(
    brotliDecompressSync(await bytes(brotli)).toString(),
    original,
    'the brotli body did not round-trip',
  );

  const gzip = compressResponse(
    accepting('gzip'),
    new Response(original, { headers: html }),
  );
  assert.equal(gzip.headers.get('content-encoding'), 'gzip');
  assert.equal(gunzipSync(await bytes(gzip)).toString(), original);
});

test('compressResponse actually makes the payload smaller', async () => {
  const original = '<html>' + 'content '.repeat(500) + '</html>';
  const compressed = await bytes(
    compressResponse(
      accepting('br'),
      new Response(original, { headers: html }),
    ),
  );
  assert.ok(
    compressed.length < Buffer.byteLength(original) / 2,
    `expected a real saving, got ${compressed.length} from ${Buffer.byteLength(original)}`,
  );
});

test('compressResponse drops content-length and varies on accept-encoding', () => {
  const body = 'a'.repeat(4000);
  const response = compressResponse(
    accepting('br'),
    new Response(body, {
      headers: { ...html, 'content-length': String(body.length) },
    }),
  );

  assert.equal(
    response.headers.get('content-length'),
    null,
    'a stale length is worse than none — it is not known until the stream ends',
  );
  assert.match(response.headers.get('vary'), /accept-encoding/i);
});

test('compressResponse appends to an existing vary rather than replacing it', () => {
  const response = compressResponse(
    accepting('br'),
    new Response('a'.repeat(4000), {
      headers: { ...html, vary: 'Accept-Language' },
    }),
  );
  const vary = response.headers.get('vary').toLowerCase();
  assert.match(vary, /accept-language/);
  assert.match(vary, /accept-encoding/);
});

test('compressResponse leaves the response alone when nothing is acceptable', async () => {
  const original = '<html>plain</html>'.repeat(200);
  const response = compressResponse(
    accepting('deflate'),
    new Response(original, { headers: html }),
  );
  assert.equal(response.headers.get('content-encoding'), null);
  assert.equal((await bytes(response)).toString(), original);
});

test('compressResponse preserves status and headers it does not own', () => {
  const response = compressResponse(
    accepting('gzip'),
    new Response('a'.repeat(4000), {
      status: 201,
      statusText: 'Created',
      headers: { ...html, 'x-ness-cache': 'MISS' },
    }),
  );
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('x-ness-cache'), 'MISS');
  assert.match(response.headers.get('content-type'), /text\/html/);
});
