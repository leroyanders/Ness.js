import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryCacheAdapter, NessCache, setCache } from '@nessframework/cache';
import { googleFont } from '../dist/font.js';
import { createFontHandler } from '../dist/font-server.js';

test('googleFont builds a self-hosted stylesheet link', () => {
  const inter = googleFont('Inter', { weight: ['400', '700'] });
  assert.equal(inter.family, 'Inter');
  assert.equal(inter.links.length, 1);
  const href = inter.links[0].href;
  assert.ok(href.startsWith('/_ness/font/css2?'));
  assert.ok(decodeURIComponent(href).includes('Inter:wght@400;700'));
  assert.equal(inter.style.fontFamily, "'Inter'");
  assert.ok(inter.className.startsWith('ness-font-'));
});

test('italic styles become the ital,wght tuple list', () => {
  const font = googleFont('Lora', {
    weight: '400',
    style: ['normal', 'italic'],
  });
  const href = decodeURIComponent(font.links[0].href);
  assert.ok(href.includes('Lora:ital,wght@0,400;1,400'));
});

function mockFetch(handler) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = original;
  };
}

test('the css2 proxy rewrites gstatic urls and caches the answer', async () => {
  setCache(new NessCache(new MemoryCacheAdapter()));
  let upstreamCalls = 0;
  const restore = mockFetch(async url => {
    upstreamCalls += 1;
    const target = String(url instanceof Request ? url.url : url);
    assert.ok(target.startsWith('https://fonts.googleapis.com/css2?'));
    return new Response(
      "@font-face{font-family:'Inter';src:url(https://fonts.gstatic.com/s/inter/v19/x.woff2) format('woff2');}",
      { headers: { 'content-type': 'text/css' } },
    );
  });
  try {
    const handler = createFontHandler();
    const request = new Request(
      'http://localhost/_ness/font/css2?family=Inter&display=swap',
    );
    const response = await handler(request);
    assert.equal(response.status, 200);
    const css = await response.text();
    assert.ok(css.includes('url(file?url=https%3A%2F%2Ffonts.gstatic.com'));
    assert.ok(!css.includes('url(https://fonts.gstatic.com'));

    const again = await handler(request);
    assert.equal(again.status, 200);
    assert.equal(upstreamCalls, 1);
  } finally {
    restore();
  }
});

test('the file proxy refuses hosts that are not fonts.gstatic.com', async () => {
  setCache(new NessCache(new MemoryCacheAdapter()));
  const restore = mockFetch(async () => {
    throw new Error('must not fetch');
  });
  try {
    const handler = createFontHandler();
    const response = await handler(
      new Request(
        `http://localhost/_ness/font/file?url=${encodeURIComponent('https://evil.example/x.woff2')}`,
      ),
    );
    assert.equal(response.status, 403);
  } finally {
    restore();
  }
});

test('the file proxy streams and caches font bytes', async () => {
  setCache(new NessCache(new MemoryCacheAdapter()));
  let upstreamCalls = 0;
  const restore = mockFetch(async () => {
    upstreamCalls += 1;
    return new Response(new Uint8Array([1, 2, 3]), {
      headers: { 'content-type': 'font/woff2' },
    });
  });
  try {
    const handler = createFontHandler();
    const url = `http://localhost/_ness/font/file?url=${encodeURIComponent('https://fonts.gstatic.com/s/inter/v19/x.woff2')}`;
    const response = await handler(new Request(url));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'font/woff2');
    assert.deepEqual(
      new Uint8Array(await response.arrayBuffer()),
      new Uint8Array([1, 2, 3]),
    );
    await handler(new Request(url));
    assert.equal(upstreamCalls, 1);
  } finally {
    restore();
  }
});
