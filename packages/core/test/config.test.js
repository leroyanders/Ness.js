import assert from 'node:assert/strict';
import test from 'node:test';
import createConfig from '../src/config/config.js';
import loadPlugin from '../src/config/plugin.js';

test('entrypoint manifests normalize production and development URLs', () => {
  const entries = { client: ['static/css/app.css', 'static/js/app.js'] };

  assert.deepEqual(
    createConfig.createEntrypointManifest('/', {}, [], entries),
    {
      client: { css: ['/static/css/app.css'], js: ['/static/js/app.js'] },
    },
  );
  assert.deepEqual(
    createConfig.createEntrypointManifest(
      'http://localhost:3001/',
      {},
      [],
      entries,
    ),
    {
      client: {
        css: ['http://localhost:3001/static/css/app.css'],
        js: ['http://localhost:3001/static/js/app.js'],
      },
    },
  );
});

test('loader finder supports string and object loader declarations', () => {
  const find = createConfig.makeLoaderFinder('babel-loader');
  assert.equal(find({ loader: 'babel-loader' }), true);
  assert.equal(find({ use: [{ loader: '/tmp/babel-loader/index.js' }] }), true);
  assert.equal(find({ use: ['style-loader'] }), false);
});

test('plugin loader prefers a named legacy install hook', async () => {
  const plugin = await loadPlugin('@ness/security');
  const config = plugin.install({ devServer: {} }, { target: 'web' });
  assert.equal(config.devServer.headers['X-Frame-Options'], 'DENY');
});
