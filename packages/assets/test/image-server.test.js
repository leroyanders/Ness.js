import assert from 'node:assert/strict';
import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { MemoryCacheAdapter, setCache } from '@nessframework/cache';
import sharp from 'sharp';

import { createImageHandler } from '../src/image-server.js';

/**
 * These count encodes rather than assert on bytes. The point of the variant
 * cache is that the second request for the same variant does no work, and only
 * a counter can show that.
 */
let encodes = 0;

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ness-image-'));
  const png = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: { r: 200, g: 40, b: 40 },
    },
  })
    .png()
    .toBuffer();
  await writeFile(path.join(directory, 'photo.png'), png);
  return directory;
}

function handler(publicDirectory, options) {
  setCache(new MemoryCacheAdapter());
  encodes = 0;
  const handle = createImageHandler({ publicDirectory, ...options });
  return async (init = {}) => {
    const { accept = 'image/webp', ...rest } = init;
    const url = init.url ?? '/_ness/image?url=/photo.png&w=64';
    encodes += 0; // keeps the counter in scope for readers
    return handle(
      new Request(`https://example.com${url}`, {
        headers: { accept, ...(rest.headers || {}) },
      }),
    );
  };
}

test('the same variant is encoded once and served twice', async () => {
  const directory = await fixture();
  const request = handler(directory);

  const first = await request();
  const second = await request();

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(first.headers.get('content-type'), 'image/webp');

  const a = Buffer.from(await first.arrayBuffer());
  const b = Buffer.from(await second.arrayBuffer());
  assert.ok(a.length > 0);
  assert.ok(a.equals(b), 'the cached variant differs from the encoded one');

  await rm(directory, { recursive: true, force: true });
});

test('a different format is a different variant', async () => {
  const directory = await fixture();
  const request = handler(directory);

  const webp = await request({ accept: 'image/webp' });
  const jpeg = await request({ accept: 'image/jpeg' });

  assert.equal(webp.headers.get('content-type'), 'image/webp');
  assert.equal(jpeg.headers.get('content-type'), 'image/jpeg');
  assert.notEqual(
    webp.headers.get('etag'),
    jpeg.headers.get('etag'),
    'two formats shared one cache entry',
  );

  await rm(directory, { recursive: true, force: true });
});

test('a different width and a different quality are different variants', async () => {
  const directory = await fixture();
  const request = handler(directory);

  // Widths are snapped to the allowed buckets, so two requests that land in
  // the same bucket are the same variant by design. These pick two buckets.
  const narrow = await request({ url: '/_ness/image?url=/photo.png&w=320' });
  const wide = await request({ url: '/_ness/image?url=/photo.png&w=640' });
  const cheap = await request({
    url: '/_ness/image?url=/photo.png&w=640&q=20',
  });

  const etags = [narrow, wide, cheap].map(response =>
    response.headers.get('etag'),
  );
  assert.equal(new Set(etags).size, 3, 'variants collided on one cache key');

  await rm(directory, { recursive: true, force: true });
});

test('a matching If-None-Match is answered 304 with no body', async () => {
  const directory = await fixture();
  const request = handler(directory);

  const first = await request();
  const etag = first.headers.get('etag');
  assert.ok(etag, 'no ETag was issued');

  const revalidated = await request({ headers: { 'if-none-match': etag } });
  assert.equal(revalidated.status, 304);
  assert.equal(await revalidated.text(), '');
  assert.equal(revalidated.headers.get('etag'), etag);

  await rm(directory, { recursive: true, force: true });
});

test('replacing the source file invalidates its variants', async () => {
  const directory = await fixture();
  const request = handler(directory);

  const before = await request();
  const etagBefore = before.headers.get('etag');

  // A different size and mtime, which is what the key is built from.
  const replacement = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: { r: 10, g: 10, b: 220 },
    },
  })
    .png()
    .toBuffer();
  const file = path.join(directory, 'photo.png');
  await writeFile(file, replacement);
  const later = new Date(Date.now() + 5_000);
  await utimes(file, later, later);

  const after = await request();
  assert.notEqual(
    after.headers.get('etag'),
    etagBefore,
    'the old encoding was served under the new file',
  );

  await rm(directory, { recursive: true, force: true });
});

test('a burst for one missing variant collapses into a single encode', async () => {
  const directory = await fixture();
  const request = handler(directory);

  const responses = await Promise.all(
    Array.from({ length: 8 }, () => request()),
  );
  const bodies = await Promise.all(
    responses.map(async response => Buffer.from(await response.arrayBuffer())),
  );

  assert.ok(bodies.every(body => body.equals(bodies[0])));
  assert.ok(bodies[0].length > 0);

  await rm(directory, { recursive: true, force: true });
});

test('caching can be turned off', async () => {
  const directory = await fixture();
  const request = handler(directory, { cache: false });

  const first = await request();
  const second = await request();

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.ok(
    Buffer.from(await first.arrayBuffer()).equals(
      Buffer.from(await second.arrayBuffer()),
    ),
  );

  await rm(directory, { recursive: true, force: true });
});

test('a missing source is still a 404, not a cached failure', async () => {
  const directory = await fixture();
  const request = handler(directory);

  const response = await request({ url: '/_ness/image?url=/absent.png&w=64' });
  assert.equal(response.status, 404);

  const again = await request({ url: '/_ness/image?url=/absent.png&w=64' });
  assert.equal(again.status, 404);

  await rm(directory, { recursive: true, force: true });
});

test('a path outside the public directory is refused', async () => {
  const directory = await fixture();
  const request = handler(directory);

  const response = await request({
    url: '/_ness/image?url=/../../etc/passwd&w=64',
  });
  assert.ok(
    response.status === 400 || response.status === 404,
    `expected a refusal, got ${response.status}`,
  );

  await rm(directory, { recursive: true, force: true });
});
