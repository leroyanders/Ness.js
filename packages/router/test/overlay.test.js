import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  isProjectFrame,
  nessErrorOverlay,
  parseStack,
  renderOverlay,
  reportServerError,
} from '../src/vite/overlay.js';

function errorWithStack(stack) {
  const error = new Error('Cannot read properties of undefined');
  error.stack = `Error: ${error.message}\n${stack}`;
  return error;
}

test('stack frames are parsed with function, file, line, and column', () => {
  const frames = parseStack(
    [
      'TypeError: nope',
      '    at loader (/app/app/routes/page.server.ts:12:19)',
      '    at file:///app/node_modules/react-router/index.js:88:3',
    ].join('\n'),
  );

  assert.deepEqual(frames[0], {
    name: 'loader',
    file: '/app/app/routes/page.server.ts',
    line: 12,
    column: 19,
  });
  assert.equal(frames[1].file, '/app/node_modules/react-router/index.js');
  assert.equal(frames[1].name, '<anonymous>');
});

test('only files inside the project, outside node_modules, count as project frames', () => {
  const root = '/app';
  assert.equal(
    isProjectFrame({ file: '/app/app/routes/page.tsx' }, root),
    true,
  );
  assert.equal(
    isProjectFrame({ file: '/app/node_modules/react/index.js' }, root),
    false,
  );
  assert.equal(isProjectFrame({ file: '/etc/passwd' }, root), false);
  assert.equal(isProjectFrame({ file: 'node:internal/process' }, root), false);
});

test('the overlay renders the message, a code frame, and an editor link', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-overlay-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'loader.js');
  fs.writeFileSync(
    file,
    [
      'const a = 1;',
      'const b = 2;',
      'throw new Error("boom");',
      'const c = 3;',
    ].join('\n'),
  );

  const html = renderOverlay(
    errorWithStack(`    at loader (${file}:3:7)`),
    { method: 'GET', url: '/products' },
    root,
  );

  assert.match(html, /Cannot read properties of undefined/);
  assert.match(html, /GET \/products/);
  assert.match(html, /throw new Error/, 'shows the failing source line');
  assert.match(html, /__open-in-editor/, 'links the frame to the editor');
  assert.match(html, /loader\.js:3:7/);
});

test('the overlay escapes error text instead of injecting it as markup', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-overlay-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const error = new Error('<img src=x onerror="alert(1)">');
  error.stack = `Error: ${error.message}\n    at loader (${root}/x.js:1:1)`;
  const html = renderOverlay(error, { method: 'GET', url: '/' }, root);

  assert.ok(!html.includes('<img src=x'), 'the message must not become markup');
  assert.match(html, /&lt;img src=x/);
});

test('a frame outside the project root cannot be used to read a file', () => {
  const html = renderOverlay(
    errorWithStack('    at read (/etc/hosts:1:1)'),
    { method: 'GET', url: '/' },
    '/app',
  );
  assert.ok(!/<section><h2>Source<\/h2>/.test(html));
});

test('reportServerError forwards a mapped error to the Vite client overlay', () => {
  const sent = [];
  const server = {
    ssrFixStacktrace() {},
    environments: { client: { hot: { send: payload => sent.push(payload) } } },
  };

  reportServerError(server, errorWithStack('    at loader (/app/a.js:4:2)'));

  assert.equal(sent.length, 1);
  assert.equal(sent[0].type, 'error');
  assert.equal(sent[0].err.loc.line, 4);
  assert.equal(sent[0].err.plugin, 'ness:error-overlay');
});

test('the plugin only applies to the dev server', () => {
  const plugin = nessErrorOverlay();
  assert.equal(plugin.apply, 'serve');
  assert.equal(plugin.name, 'ness:error-overlay');
});

test('the middleware answers HTML requests and defers everything else', async () => {
  const plugin = nessErrorOverlay();
  const registered = [];
  const server = {
    config: { root: '/app' },
    ssrFixStacktrace() {},
    middlewares: { use: middleware => registered.push(middleware) },
  };
  plugin.configureServer(server)();
  const [middleware] = registered;

  const htmlResponse = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body;
    },
  };
  middleware(
    errorWithStack('    at loader (/app/a.js:1:1)'),
    { method: 'GET', url: '/', headers: { accept: 'text/html' } },
    htmlResponse,
    () => assert.fail('an HTML request must be answered, not deferred'),
  );
  assert.equal(htmlResponse.statusCode, 500);
  assert.match(htmlResponse.headers['content-type'], /text\/html/);

  let deferred;
  middleware(
    errorWithStack('    at loader (/app/a.js:1:1)'),
    {
      method: 'GET',
      url: '/api/users',
      headers: { accept: 'application/json' },
    },
    { setHeader() {}, end() {} },
    error => {
      deferred = error;
    },
  );
  assert.ok(deferred, 'a non-HTML request keeps the default error handling');
});

/* Regressions found by adversarial review of the overlay. */

test('a multi-line error message cannot inject a stack frame', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-overlay-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const secret = path.join(root, 'secret.txt');
  fs.writeFileSync(secret, 'hunter2');

  // The message is attacker-influenced whenever user input is echoed into it.
  const error = new Error(`nope\n    at inject (${secret}:1:1)`);
  error.stack = `Error: ${error.message}\n    at real (${root}/app.js:2:2)`;

  const html = renderOverlay(error, { method: 'GET', url: '/' }, root);
  assert.ok(!html.includes('hunter2'), 'the injected frame must not be read');
});

test('a dotfile the dev server refuses to serve is not read either', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-overlay-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  for (const name of ['.env', '.npmrc', 'server.key']) {
    fs.writeFileSync(path.join(root, name), 'SECRET=hunter2');
    assert.equal(
      isProjectFrame({ file: path.join(root, name) }, root),
      false,
      `${name} must be denied`,
    );
  }
});

test('a path on another Windows drive is not inside the project', () => {
  // path.relative cannot express this and returns the target unchanged.
  const relative = path.win32.relative('C:\\proj', 'D:\\secrets\\creds');
  assert.equal(relative, 'D:\\secrets\\creds');
  assert.equal(path.win32.isAbsolute(relative), true, 'so it must be rejected');
});
