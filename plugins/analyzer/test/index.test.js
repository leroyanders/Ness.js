import assert from 'node:assert/strict';
import test from 'node:test';
import analyzer from '../src/index.js';

test('analyzer emits JSON and HTML reports', () => {
  const emitted = [];
  const plugin = analyzer();
  plugin.generateBundle.call(
    {
      emitFile: asset => emitted.push(asset),
      error: message => {
        throw new Error(message);
      },
    },
    {},
    {
      'entry.js': { type: 'chunk', code: 'export default 1;', modules: {} },
      'app.css': { type: 'asset', source: 'body{}' },
    },
  );

  assert.deepEqual(
    emitted.map(asset => asset.fileName),
    ['ness-bundle-report.json', 'ness-bundle-report.html'],
  );
  const report = JSON.parse(emitted[0].source);
  assert.equal(report.files.length, 2);
  assert.ok(report.totalSize > 0);
});

test('analyzer enforces the configured size budget', () => {
  const plugin = analyzer({ maxSize: 1, html: false });
  assert.throws(
    () =>
      plugin.generateBundle.call(
        {
          emitFile() {},
          error: message => {
            throw new Error(message);
          },
        },
        {},
        { 'entry.js': { type: 'chunk', code: 'large bundle', modules: {} } },
      ),
    /exceeds/,
  );
});
