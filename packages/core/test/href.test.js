import assert from 'node:assert/strict';
import test from 'node:test';
import { href } from '@nessframework/core';

test('href fills a pattern in and escapes what it puts there', () => {
  assert.equal(
    href('/blog/:slug', { slug: 'hello world' }),
    '/blog/hello%20world',
  );
  assert.equal(href('/about'), '/about');
  assert.equal(
    href('/teams/:team/members/:id', { team: 'a', id: 7 }),
    '/teams/a/members/7',
  );
});

test('a missing parameter is an error, not a URL with a colon in it', () => {
  assert.throws(() => href('/blog/:slug'), /slug/);
});

test('a splat is filled from `splat`, and empty when there is none', () => {
  assert.equal(href('/files/*', { splat: 'a/b.txt' }), '/files/a/b.txt');
  assert.equal(href('/files/*'), '/files/');
});
