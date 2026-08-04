import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeLife } from '../src/index.js';
import { SqliteCacheAdapter } from '../src/adapters/sqlite.js';

const available = await import('node:sqlite').then(
  () => true,
  () => false,
);

function entry(value, { tags = [], path: pathname, life = 'default' } = {}) {
  return {
    value,
    createdAt: 0,
    life: normalizeLife(life),
    tags,
    path: pathname,
  };
}

test(
  'sqlite adapter shares tags and paths through a single database file',
  { skip: available ? false : 'node:sqlite is unavailable on this runtime' },
  async t => {
    const adapter = await SqliteCacheAdapter.open({ filename: ':memory:' });
    t.after(() => adapter.close());

    await adapter.set(
      'a',
      entry({ title: 'Post' }, { tags: ['posts'], path: '/blog' }),
    );
    await adapter.set('b', entry(2, { tags: ['posts'], path: '/blog/post' }));
    await adapter.set('c', entry(3, { tags: ['pages'], path: '/about' }));

    assert.deepEqual((await adapter.get('a')).value, { title: 'Post' });
    assert.deepEqual((await adapter.keysByTag('posts')).sort(), ['a', 'b']);
    assert.deepEqual((await adapter.keysByPath('/blog')).sort(), ['a', 'b']);
    assert.deepEqual(await adapter.keysByPath('/about'), ['c']);

    await adapter.set('a', entry(9, { tags: ['archive'] }));
    assert.deepEqual(await adapter.keysByTag('posts'), ['b']);
    assert.deepEqual(await adapter.keysByTag('archive'), ['a']);

    await adapter.delete('b');
    assert.equal(await adapter.get('b'), undefined);
    assert.deepEqual((await adapter.keys()).sort(), ['a', 'c']);
  },
);

test(
  'sqlite adapter round-trips an infinite expiry',
  { skip: available ? false : 'node:sqlite is unavailable on this runtime' },
  async t => {
    const adapter = await SqliteCacheAdapter.open({ filename: ':memory:' });
    t.after(() => adapter.close());

    await adapter.set('forever', entry('value', { life: 'max' }));
    assert.equal((await adapter.get('forever')).life.expire, Infinity);
  },
);
