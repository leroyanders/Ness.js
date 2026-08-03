import assert from 'node:assert/strict';
import test from 'node:test';
import { loadRouteData, serializeForScript } from '../src/server/dom.js';

test('route data loaders run once and resolve independent values', async () => {
  let calls = 0;
  function Page() {}
  Page.useServerSideFetching = () => {
    calls += 1;
    return {
      users: Promise.resolve({ data: ['Ada'] }),
      count: Promise.resolve(1),
    };
  };

  const store = { application: { name: 'Ness.js' } };
  await loadRouteData([{ path: '/users', component: Page }], '/users', store);

  assert.equal(calls, 1);
  assert.deepEqual(store, {
    application: { name: 'Ness.js' },
    users: ['Ada'],
    count: 1,
  });
});

test('SSR state serialization cannot terminate its script element', () => {
  const serialized = serializeForScript({
    value: '</script><script>alert(1)</script>',
  });
  assert.equal(serialized.includes('<'), false);
  assert.match(serialized, /\\u003c\/script/);
});
