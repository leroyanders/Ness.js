import assert from 'node:assert/strict';
import test from 'node:test';

import { gracefulShutdown } from '../dist/index.js';

/**
 * A stand-in for `http.Server` that records what was asked of it, so the order
 * of operations can be asserted without binding a port or exiting the runner.
 */
function fakeServer({ drainAfter = 0 } = {}) {
  const calls = [];
  let finish;

  return {
    calls,
    close(callback) {
      calls.push('close');
      if (drainAfter === 0) return void setImmediate(() => callback());
      // Held open until `release()` — a keep-alive socket that never ends.
      finish = () => callback();
    },
    closeIdleConnections() {
      calls.push('closeIdleConnections');
      // Releasing idle sockets is what lets the close callback fire.
      finish?.();
      finish = undefined;
    },
    closeAllConnections() {
      calls.push('closeAllConnections');
    },
  };
}

function shutdown(server, options = {}) {
  const exited = [];
  const signal = `SIGTERM-${Math.random()}`;
  const dispose = gracefulShutdown(server, {
    signals: [signal],
    exit: code => exited.push(code),
    ...options,
  });
  return { exited, fire: () => process.emit(signal), dispose };
}

const settle = () => new Promise(resolve => setTimeout(resolve, 50));

test('readiness fails before the socket is closed', async t => {
  const server = fakeServer();
  const order = [];

  const { fire, dispose } = shutdown(server, {
    onDraining: () => order.push('draining'),
  });
  t.after(dispose);

  fire();
  await settle();

  assert.deepEqual(
    order,
    ['draining'],
    'readiness never failed, so the balancer kept routing here',
  );
  assert.ok(server.calls.indexOf('close') >= 0, 'the server was never closed');
});

test('idle keep-alive sockets are released so the drain can finish', async t => {
  // `close` only completes once idle connections are released.
  const server = fakeServer({ drainAfter: Infinity });
  const { exited, fire, dispose } = shutdown(server, { timeout: 5_000 });
  t.after(dispose);

  fire();
  await settle();

  assert.ok(
    server.calls.includes('closeIdleConnections'),
    'idle sockets were never released, so close would hang until SIGKILL',
  );
  assert.deepEqual(exited, [0]);
});

test('cleanup runs after the drain, not before', async t => {
  const server = fakeServer();
  const order = [];

  const { fire, dispose } = shutdown(server, {
    onDraining: () => order.push('draining'),
    onShutdown: () => order.push('shutdown'),
  });
  t.after(dispose);

  fire();
  await settle();

  assert.deepEqual(
    order,
    ['draining', 'shutdown'],
    'the API layer was disposed while requests were still using it',
  );
});

test('a drain that overruns the timeout cuts what is left and exits non-zero', async t => {
  const server = {
    close() {}, // never calls back, and no idle sockets to release
    closeAllConnections() {
      this.cut = true;
    },
  };
  const { exited, fire, dispose } = shutdown(server, { timeout: 30 });
  t.after(dispose);

  fire();
  await settle();

  assert.equal(server.cut, true, 'the remaining connections were left open');
  assert.deepEqual(exited, [1]);
});

test('a second signal does not start a second shutdown', async t => {
  const server = fakeServer();
  const { exited, fire, dispose } = shutdown(server);
  t.after(dispose);

  fire();
  fire();
  await settle();

  assert.deepEqual(exited, [0]);
  assert.equal(server.calls.filter(call => call === 'close').length, 1);
});

test('a failing readiness flip does not stop the drain', async t => {
  const server = fakeServer();
  const { exited, fire, dispose } = shutdown(server, {
    onDraining() {
      throw new Error('the health endpoint is already gone');
    },
  });
  t.after(dispose);

  fire();
  await settle();

  assert.deepEqual(exited, [0]);
});

test('a close error exits non-zero', async t => {
  const server = {
    close(callback) {
      setImmediate(() => callback(new Error('address in use')));
    },
  };
  const { exited, fire, dispose } = shutdown(server);
  t.after(dispose);

  fire();
  await settle();

  assert.deepEqual(exited, [1]);
});
