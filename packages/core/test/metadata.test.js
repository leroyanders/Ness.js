import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRobots,
  createSitemap,
  mergeMetadata,
  metadataToDescriptors,
} from '../src/metadata/index.js';

test('metadata creates SEO, Open Graph, Twitter, and canonical descriptors', () => {
  const descriptors = metadataToDescriptors({
    title: 'Ness',
    description: 'Framework',
    alternates: { canonical: 'https://ness.dev' },
    openGraph: { type: 'website', images: [{ url: '/og.png', width: 1200 }] },
    twitter: { card: 'summary_large_image' },
  });
  assert.ok(descriptors.some(item => item.title === 'Ness'));
  assert.ok(
    descriptors.some(
      item => item.property === 'og:image' && item.content === '/og.png',
    ),
  );
  assert.ok(descriptors.some(item => item.name === 'twitter:card'));
  assert.ok(descriptors.some(item => item.rel === 'canonical'));
});

test('nested metadata merges structured fields', () => {
  const result = mergeMetadata(
    {
      title: { default: 'Parent', template: '%s | Ness' },
      openGraph: { siteName: 'Ness' },
      alternates: { canonical: '/' },
    },
    { title: 'Child', openGraph: { type: 'article' } },
  );
  assert.deepEqual(result.openGraph, { siteName: 'Ness', type: 'article' });
  assert.equal(result.title, 'Child | Ness');
  assert.equal(result.alternates.canonical, '/');
});

test('metadata endpoint helpers emit valid response formats', async () => {
  const robots = createRobots({ sitemap: 'https://ness.dev/sitemap.xml' });
  assert.match(await robots.text(), /Sitemap:/);
  const sitemap = createSitemap([
    { url: 'https://ness.dev/<docs>', priority: 0.8 },
  ]);
  assert.match(await sitemap.text(), /&lt;docs&gt;/);
  assert.equal(
    sitemap.headers.get('content-type'),
    'application/xml; charset=utf-8',
  );
});
