import assert from 'node:assert/strict';
import test from 'node:test';
import { ImageResponse } from '@nessframework/assets/og';

const ELEMENT = { type: 'div', props: { children: 'hello' } };

test('an ImageResponse is a Response, typed and cached as a share card', () => {
  const response = new ImageResponse(ELEMENT, { width: 100, height: 50 });
  assert.ok(response instanceof Response);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.match(response.headers.get('cache-control'), /max-age|no-store/);
});

test('the format decides the content type', () => {
  const svg = new ImageResponse(ELEMENT, { format: 'svg' });
  assert.equal(svg.headers.get('content-type'), 'image/svg+xml');
});

test('the body is produced lazily, so constructing one costs nothing', async () => {
  // No fonts and (here) no satori: constructing must not throw, reading must.
  const response = new ImageResponse(ELEMENT, {});
  await assert.rejects(() => response.arrayBuffer(), /satori|font/i);
});
