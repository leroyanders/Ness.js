import assert from 'node:assert/strict';
import test from 'node:test';
import { matchPage, segmentCachePolicy } from '@nessframework/server';

const PAGES = [
  { path: '/', config: { revalidate: 60 } },
  { path: '/blog/:slug', config: { dynamic: 'force-dynamic' } },
  { path: '/blog/feed', config: { revalidate: false } },
  { path: '/about' },
];

test('the longest matching pattern wins, the way the router resolves it', () => {
  assert.equal(matchPage(PAGES, '/blog/feed').path, '/blog/feed');
  assert.equal(matchPage(PAGES, '/blog/anything').path, '/blog/:slug');
  assert.equal(matchPage(PAGES, '/'), PAGES[0]);
  assert.equal(matchPage(PAGES, '/nowhere'), undefined);
});

test('force-dynamic and revalidate = 0 take the page out of the shared cache', () => {
  assert.deepEqual(segmentCachePolicy({ dynamic: 'force-dynamic' }), {
    cacheable: false,
  });
  assert.deepEqual(segmentCachePolicy({ revalidate: 0 }), { cacheable: false });
});

test('revalidate becomes a life the page cache can hold', () => {
  const policy = segmentCachePolicy({ revalidate: 60 });
  assert.equal(policy.cacheable, true);
  assert.equal(policy.life.revalidate, 60);
  assert.equal(policy.life.stale, 60);
  assert.ok(policy.life.expire >= 60);

  assert.equal(segmentCachePolicy({ revalidate: false }).life.expire, Infinity);
  assert.deepEqual(segmentCachePolicy({ dynamic: 'force-static' }), {
    cacheable: true,
  });
  assert.equal(segmentCachePolicy(undefined), undefined);
  assert.equal(segmentCachePolicy({}), undefined);
});
