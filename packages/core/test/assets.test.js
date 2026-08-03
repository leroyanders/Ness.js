import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FontStyles, localFont } from '../src/assets/font.js';
import { Image, imageUrl } from '../src/assets/image.js';

test('Image emits responsive optimized image URLs', () => {
  const markup = renderToStaticMarkup(
    React.createElement(Image, {
      src: '/hero.png',
      alt: 'Hero',
      width: 640,
      height: 320,
    }),
  );
  assert.match(markup, /_ness\/image/);
  assert.match(markup, /srcSet=/);
  assert.match(imageUrl('/hero.png', 640), /w=640/);
});

test('localFont emits preload links and self-hosted font CSS', () => {
  const font = localFont({ src: '/fonts/inter.woff2', family: 'Inter' });
  const markup = renderToStaticMarkup(
    React.createElement(FontStyles, { fonts: font }),
  );
  assert.match(markup, /rel="preload"/);
  assert.match(markup, /@font-face/);
  assert.match(font.className, /^ness-font-/);
});
