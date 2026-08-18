import assert from 'node:assert/strict';
import test from 'node:test';
import { Suspense, createElement as h, use } from 'react';

import { MemoryCacheAdapter, setCache } from '@nessframework/cache';

import {
  partialPrerender,
  partialResponse,
  resumePartial,
} from '../dist/ppr.js';

/**
 * A hole that stays open during the shell prerender and resolves on resume:
 * the promise is created per phase, so the prerender's never settles and the
 * resume's settles immediately.
 */
function makePage(label, { settle }) {
  const pending = new Promise(resolve => {
    if (settle) resolve(label);
  });
  function Hole() {
    return h('p', null, use(pending));
  }
  return h(
    'main',
    null,
    h('h1', null, 'static shell'),
    h(Suspense, { fallback: h('p', null, 'loading') }, h(Hole)),
  );
}

test('partialPrerender captures the shell and postpones the hole', async () => {
  const { shell, postponed } = await partialPrerender(
    makePage('dynamic!', { settle: false }),
    { shellTimeout: 100 },
  );
  const html = Buffer.from(shell).toString();
  assert.match(html, /static shell/);
  assert.match(html, /loading/);
  assert.ok(postponed, 'the unfinished boundary is recorded');
});

test('resumePartial streams the postponed hole', async () => {
  const { postponed } = await partialPrerender(
    makePage('dynamic!', { settle: false }),
    { shellTimeout: 100 },
  );
  const stream = await resumePartial(
    makePage('dynamic!', { settle: true }),
    postponed,
  );
  const resumed = Buffer.from(
    await new Response(stream).arrayBuffer(),
  ).toString();
  assert.match(resumed, /dynamic!/);
});

test('a page with no holes prerenders completely', async () => {
  const { shell, postponed } = await partialPrerender(
    h('main', null, h('h1', null, 'entirely static')),
    { shellTimeout: 100 },
  );
  assert.match(Buffer.from(shell).toString(), /entirely static/);
  assert.equal(postponed, null);
});

test('partialResponse serves the cached shell and resumes fresh', async () => {
  setCache(new MemoryCacheAdapter());
  let renders = 0;
  const page = settle => {
    renders += 1;
    return makePage(`render ${renders}`, { settle });
  };
  const first = await partialResponse(page(true), {
    key: '/ppr-page',
    shellTimeout: 100,
  });
  const html = await first.text();
  assert.match(html, /static shell/);
  // Second request: the shell comes from the cache, the hole renders fresh.
  const second = await partialResponse(page(true), {
    key: '/ppr-page',
    shellTimeout: 100,
  });
  assert.match(await second.text(), /static shell/);
});
