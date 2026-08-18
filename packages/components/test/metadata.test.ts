import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  FileMetadataTags,
  MetadataTags,
  RouteMetadata,
  dynamic,
} from '../dist/index.js';

test('MetadataTags renders the object as tags', () => {
  const html = renderToStaticMarkup(
    h(MetadataTags, {
      metadata: {
        title: 'Pricing',
        description: 'What it costs.',
        keywords: ['pricing', 'plans'],
        robots: { index: true, follow: false },
        alternates: { canonical: 'https://example.com/pricing' },
        openGraph: {
          siteName: 'Ness',
          images: [{ url: 'https://example.com/og.png', width: 1200 }],
        },
        twitter: { creator: '@ness' },
      },
    }),
  );
  assert.match(html, /<title>Pricing<\/title>/);
  assert.match(html, /name="description" content="What it costs\."/);
  assert.match(html, /name="keywords" content="pricing, plans"/);
  assert.match(html, /name="robots" content="index, nofollow"/);
  assert.match(
    html,
    /rel="canonical" href="https:\/\/example.com\/pricing"/,
  );
  assert.match(html, /property="og:site_name" content="Ness"/);
  assert.match(html, /property="og:image" content="https:\/\/example.com\/og.png"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /name="twitter:creator" content="@ness"/);
  // The description flows into Open Graph unless overridden.
  assert.match(html, /property="og:description" content="What it costs\."/);
});

test('a parent template shapes the page title', () => {
  const html = renderToStaticMarkup(
    h(MetadataTags, {
      metadata: { title: 'Pricing' },
      parents: [{ title: { template: '%s | Ness', default: 'Ness' } }],
    }),
  );
  assert.match(html, /<title>Pricing \| Ness<\/title>/);
});

test('title.absolute escapes the template', () => {
  const html = renderToStaticMarkup(
    h(MetadataTags, {
      metadata: { title: { absolute: 'Standalone' } },
      parents: [{ title: { template: '%s | Ness' } }],
    }),
  );
  assert.match(html, /<title>Standalone<\/title>/);
});

test('the nearest template wins', () => {
  const html = renderToStaticMarkup(
    h(MetadataTags, {
      metadata: { title: 'Deep' },
      parents: [
        { title: { template: '%s | Site' } },
        { title: { template: '%s — Section' } },
      ],
    }),
  );
  assert.match(html, /<title>Deep — Section<\/title>/);
});

test('metadataBase resolves relative URLs', () => {
  const html = renderToStaticMarkup(
    h(MetadataTags, {
      metadata: {
        metadataBase: 'https://example.com',
        alternates: { canonical: '/pricing' },
        openGraph: { images: '/og.png' },
      },
    }),
  );
  assert.match(html, /href="https:\/\/example.com\/pricing"/);
  assert.match(html, /content="https:\/\/example.com\/og.png"/);
});

test('RouteMetadata calls generateMetadata with params', () => {
  const generate = ({ params }) => ({ title: `Post ${params.slug}` });
  const html = renderToStaticMarkup(
    h(RouteMetadata, {
      metadata: generate,
      args: { params: { slug: 'hello' } },
    }),
  );
  assert.match(html, /<title>Post hello<\/title>/);
});

test('FileMetadataTags renders icons and social images', () => {
  const html = renderToStaticMarkup(
    h(FileMetadataTags, {
      icon: ['/assets/icon-abc123.png'],
      apple: ['/assets/apple-abc.png'],
      og: ['/blog/:slug/opengraph-image'],
      params: { slug: 'hello' },
    }),
  );
  assert.match(html, /rel="icon" href="\/assets\/icon-abc123.png"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(
    html,
    /property="og:image" content="\/blog\/hello\/opengraph-image"/,
  );
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
});

test('dynamic({ssr: false}) renders the loading fallback on the server', () => {
  const Late = dynamic(
    () => Promise.resolve({ default: () => h('p', null, 'late') }),
    { ssr: false, loading: () => h('p', null, 'loading') },
  );
  const html = renderToStaticMarkup(h(Late));
  assert.equal(html, '<p>loading</p>');
});
