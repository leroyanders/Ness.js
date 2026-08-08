import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { FileSystemCacheAdapter } from '../src/adapters/filesystem.js';
import { decodeEntry, encodeEntry } from '../src/adapters/serialize.js';
import { NessCache } from '../src/index.js';

/**
 * The page cache stores a response body as an ArrayBuffer. `JSON.stringify`
 * turns that into `{}`, so every shared store used to answer with an entry that
 * was a hit and empty — a blank page rather than an error. Only the in-process
 * store was unaffected, which is exactly the one used in development.
 */
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3,
]);

function bytesOf(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value))
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  return undefined;
}

function roundTrip(value) {
  return decodeEntry(
    encodeEntry('k', {
      value,
      createdAt: 0,
      life: { stale: 0, revalidate: 1, expire: 2 },
      tags: [],
    }),
  ).value;
}

test('a Buffer round-trips as a Buffer', () => {
  const back = roundTrip(PNG);
  assert.ok(Buffer.isBuffer(back));
  assert.ok(back.equals(PNG));
});

test('an ArrayBuffer round-trips as an ArrayBuffer', () => {
  const source = PNG.buffer.slice(
    PNG.byteOffset,
    PNG.byteOffset + PNG.byteLength,
  );
  const back = roundTrip(source);
  assert.ok(back instanceof ArrayBuffer);
  assert.ok(Buffer.from(back).equals(PNG));
});

test('a typed array round-trips as the same view type', () => {
  const back = roundTrip(new Uint8Array(PNG));
  assert.ok(back instanceof Uint8Array);
  assert.ok(bytesOf(back).equals(PNG));
});

test('binary nested inside an object survives, as a page body is', () => {
  const back = roundTrip({
    body: PNG.buffer.slice(PNG.byteOffset, PNG.byteOffset + PNG.byteLength),
    headers: [['content-type', 'image/png']],
    status: 200,
  });

  assert.equal(back.status, 200);
  assert.deepEqual(back.headers, [['content-type', 'image/png']]);
  assert.ok(
    bytesOf(back.body).equals(PNG),
    'the page body did not survive the shared store',
  );
});

test('ordinary values are untouched', () => {
  assert.deepEqual(roundTrip({ a: 1, b: 'two', c: [3, null], d: true }), {
    a: 1,
    b: 'two',
    c: [3, null],
    d: true,
  });
  assert.equal(roundTrip('plain'), 'plain');
  assert.equal(roundTrip(42), 42);
  assert.equal(roundTrip(null), null);
});

test('an object that merely looks like a marker is not decoded', () => {
  const back = roundTrip({ kind: 'Buffer', unrelated: 'value' });
  assert.deepEqual(back, { kind: 'Buffer', unrelated: 'value' });
});

test('binary survives the filesystem adapter end to end', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ness-binary-'));
  const cache = new NessCache(new FileSystemCacheAdapter({ directory }));

  const body = PNG.buffer.slice(
    PNG.byteOffset,
    PNG.byteOffset + PNG.byteLength,
  );
  await cache.write('page:/', { body, status: 200 }, { life: 'minutes' });

  const read = await cache.read('page:/');
  assert.equal(read.state, 'fresh');
  assert.ok(bytesOf(read.entry.value.body).equals(PNG));

  await rm(directory, { recursive: true, force: true });
});
