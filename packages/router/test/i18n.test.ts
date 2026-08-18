import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  localizePath,
  matchAcceptLanguage,
  normalizeI18n,
  resolveLocale,
} from '../dist/i18n.js';
import { createLocaleMiddleware } from '../dist/i18n-runtime.js';
import { nessRoutes } from '../dist/routes.js';

const CONFIG = normalizeI18n({
  locales: ['en', 'de', 'pt-BR'],
  defaultLocale: 'en',
});

test('the configuration rejects malformed input', () => {
  assert.equal(normalizeI18n(undefined), undefined);
  assert.throws(() => normalizeI18n({ locales: [] }), /non-empty array/);
  assert.throws(() => normalizeI18n({ locales: ['english!'] }), /BCP 47/);
  assert.throws(() => normalizeI18n({ locales: ['en', 'en'] }), /duplicates/);
  assert.throws(
    () => normalizeI18n({ locales: ['en'], defaultLocale: 'de' }),
    /must be one of/,
  );
  assert.throws(
    () => normalizeI18n({ locales: ['en'], strategy: 'subdomain' }),
    /Unknown i18n.strategy/,
  );
  assert.equal(normalizeI18n({ locales: ['de', 'en'] }).defaultLocale, 'de');
});

test('a pathname resolves to its locale and remainder', () => {
  assert.deepEqual(resolveLocale('/de/blog', CONFIG), {
    locale: 'de',
    pathname: '/blog',
  });
  assert.deepEqual(resolveLocale('/pt-BR', CONFIG), {
    locale: 'pt-BR',
    pathname: '/',
  });
  assert.deepEqual(resolveLocale('/blog', CONFIG), {
    locale: 'en',
    pathname: '/blog',
    prefixed: false,
  });
});

test('localizePath round-trips between locales', () => {
  assert.equal(localizePath('/blog', 'de', CONFIG), '/de/blog');
  assert.equal(localizePath('/de/blog', 'pt-BR', CONFIG), '/pt-BR/blog');
  assert.equal(localizePath('/de/blog', 'en', CONFIG), '/blog');
  assert.equal(localizePath('/de', 'en', CONFIG), '/');
  assert.equal(localizePath('/', 'de', CONFIG), '/de');
  assert.throws(() => localizePath('/', 'ja', CONFIG), /Unknown locale/);
});

test('the prefix strategy also prefixes the default locale', () => {
  const config = normalizeI18n({ locales: ['en', 'de'], strategy: 'prefix' });
  assert.equal(localizePath('/blog', 'en', config), '/en/blog');
  assert.equal(localizePath('/de/blog', 'en', config), '/en/blog');
});

test('Accept-Language honours quality values and falls back by language', () => {
  assert.equal(matchAcceptLanguage('de-AT,de;q=0.9,en;q=0.5', CONFIG), 'de');
  assert.equal(matchAcceptLanguage('en;q=0.4,de;q=0.9', CONFIG), 'de');
  assert.equal(
    matchAcceptLanguage('pt;q=0.9', CONFIG),
    'pt-BR',
    'a base language should match a configured regional variant',
  );
  assert.equal(matchAcceptLanguage('ja,ko;q=0.8', CONFIG), 'en');
  assert.equal(matchAcceptLanguage('*', CONFIG), 'en');
  assert.equal(matchAcceptLanguage(null, CONFIG), 'en');
});

test('the middleware redirects only unprefixed non-default requests', () => {
  const middleware = createLocaleMiddleware(CONFIG);

  const redirect = middleware(
    new Request('https://ness.dev/blog', {
      headers: { 'accept-language': 'de-DE,de;q=0.9' },
    }),
  );
  assert.equal(redirect.status, 307);
  assert.equal(redirect.headers.get('location'), '/de/blog');
  assert.match(redirect.headers.get('vary'), /accept-language/);
  assert.match(redirect.headers.get('set-cookie'), /ness-locale=de/);

  assert.equal(
    middleware(
      new Request('https://ness.dev/de/blog', {
        headers: { 'accept-language': 'de' },
      }),
    ),
    undefined,
    'an already prefixed request must not redirect',
  );
  assert.equal(
    middleware(
      new Request('https://ness.dev/blog', {
        headers: { 'accept-language': 'en-US' },
      }),
    ),
    undefined,
    'the default locale is served unprefixed',
  );
});

test('an explicit choice in the cookie wins over the browser header', () => {
  const middleware = createLocaleMiddleware(CONFIG);
  const response = middleware(
    new Request('https://ness.dev/blog', {
      headers: { 'accept-language': 'de', cookie: 'ness-locale=pt-BR' },
    }),
  );
  assert.equal(response.headers.get('location'), '/pt-BR/blog');
});

test('a query string survives the redirect', () => {
  const middleware = createLocaleMiddleware(CONFIG);
  const response = middleware(
    new Request('https://ness.dev/search?q=vite', {
      headers: { 'accept-language': 'de' },
    }),
  );
  assert.equal(response.headers.get('location'), '/de/search?q=vite');
});

function createApp(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-i18n-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const routes = path.join(root, 'app', 'routes');
  fs.mkdirSync(path.join(routes, 'blog'), { recursive: true });
  fs.writeFileSync(
    path.join(routes, 'page.tsx'),
    'export default function Home(){ return null; }\n',
  );
  fs.writeFileSync(
    path.join(routes, 'blog', 'page.tsx'),
    'export default function Blog(){ return null; }\n',
  );
  return path.join(root, 'app');
}

test('localized discovery mounts the tree at the root and under each locale', async t => {
  const appDirectory = createApp(t);
  const routes = await nessRoutes({
    appDirectory,
    i18n: { locales: ['en', 'de', 'fr'], defaultLocale: 'en' },
  });

  const localized = routes.filter(route => ['de', 'fr'].includes(route.path));
  assert.equal(localized.length, 2, 'one branch per non-default locale');
  assert.ok(
    routes.some(route => !['de', 'fr'].includes(route.path)),
    'prefix-except-default keeps the untranslated tree at the root',
  );

  const ids = [];
  const collect = list => {
    for (const route of list) {
      ids.push(route.id);
      if (route.children) collect(route.children);
    }
  };
  collect(routes);
  assert.equal(
    new Set(ids).size,
    ids.length,
    'duplicated routes must not collide on ids',
  );
});

test('an unknown locale simply does not match a locale branch', async t => {
  const appDirectory = createApp(t);
  const routes = await nessRoutes({
    appDirectory,
    i18n: { locales: ['en', 'de'] },
  });

  // Static segments mean there is nothing to validate at runtime: /xx matches
  // no locale branch, so it falls through to the application's own routing.
  assert.ok(!routes.some(route => route.path === 'xx'));

  const generated = fs.readFileSync(
    path.join(appDirectory, '.ness', 'routes', 'ness__locale.tsx'),
    'utf8',
  );
  assert.ok(
    !generated.includes('404'),
    'the layout no longer needs a rejecting loader',
  );
  assert.match(generated, /Outlet/);
});

/* Regressions found by adversarial review of the localized routing. */

test('a locale branch does not swallow the application 404', async t => {
  const appDirectory = createApp(t);
  fs.writeFileSync(
    path.join(appDirectory, 'routes', 'not-found.tsx'),
    'export default function NotFound(){ return null; }\n',
  );
  const routes = await nessRoutes({
    appDirectory,
    i18n: { locales: ['en', 'de'], defaultLocale: 'en' },
  });

  const paths = routes.map(route => route.path);
  assert.ok(
    !paths.includes(':locale'),
    'a dynamic segment would outrank the root not-found route',
  );
  assert.ok(paths.includes('de'), 'each locale is its own static segment');
});

test('prefix-except-default does not publish the default locale twice', async t => {
  const appDirectory = createApp(t);
  const routes = await nessRoutes({
    appDirectory,
    i18n: { locales: ['en', 'de'], defaultLocale: 'en' },
  });

  assert.ok(
    !routes.some(route => route.path === 'en'),
    'the default locale is served at the root, so /en would duplicate it',
  );
  assert.ok(routes.some(route => route.path === 'de'));
});

test('the prefix strategy mounts every locale, including the default', async t => {
  const appDirectory = createApp(t);
  const routes = await nessRoutes({
    appDirectory,
    i18n: { locales: ['en', 'de'], strategy: 'prefix' },
  });

  assert.deepEqual(routes.map(route => route.path).sort(), ['de', 'en']);
});

test('the prefix strategy redirects the default locale too', () => {
  const config = normalizeI18n({ locales: ['en', 'de'], strategy: 'prefix' });
  const middleware = createLocaleMiddleware(config);
  const response = middleware(
    new Request('https://ness.dev/blog', {
      headers: { 'accept-language': 'en-US,en;q=0.9' },
    }),
  );

  assert.ok(response, 'nothing is mounted outside a locale segment');
  assert.equal(response.headers.get('location'), '/en/blog');
});

test('q=0 means not acceptable', () => {
  const config = normalizeI18n({ locales: ['en', 'de'], defaultLocale: 'en' });
  assert.equal(matchAcceptLanguage('de;q=0,en;q=0.5', config), 'en');
  assert.equal(matchAcceptLanguage('de;Q=0.9,en;q=0.1', config), 'de');
});
