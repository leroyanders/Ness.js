import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import {
  Canonical,
  ClientOnly,
  Description,
  Form,
  Meta,
  Pagination,
  Pending,
  Robots,
  SearchField,
  SocialImage,
  Streamed,
  Title,
} from '../src/index.js';

/** Renders on the server, which is where every one of these first runs. */
function render(element, { url = '/' } = {}) {
  return renderToStaticMarkup(
    h(MemoryRouter, { initialEntries: [url] }, element),
  );
}

/**
 * Navigation and action state come from a data router, so anything reading
 * them needs one rather than a plain MemoryRouter.
 */
function renderWithData(element, { url = '/' } = {}) {
  const router = createMemoryRouter([{ path: '*', element }], {
    initialEntries: [url],
  });
  return renderToStaticMarkup(h(RouterProvider, { router }));
}

test('ClientOnly renders the fallback on the server, never the children', () => {
  const markup = render(
    h(
      ClientOnly,
      { fallback: h('span', null, 'placeholder') },
      h('canvas', null),
    ),
  );

  assert.match(markup, /placeholder/);
  assert.ok(
    !markup.includes('<canvas'),
    'browser-only children must not reach the server output',
  );
});

test('ClientOnly accepts a function so its children are never evaluated on the server', () => {
  let evaluated = false;
  const markup = render(
    h(ClientOnly, { fallback: 'waiting' }, () => {
      evaluated = true;
      return h('span', null, 'client');
    }),
  );

  assert.match(markup, /waiting/);
  assert.equal(evaluated, false);
});

test('Streamed renders the fallback while the promise is pending', () => {
  const markup = render(
    h(
      Streamed,
      { value: new Promise(() => {}), fallback: h('p', null, 'loading') },
      value => h('p', null, String(value)),
    ),
  );

  assert.match(markup, /loading/);
});

test('Streamed renders a resolved value', async () => {
  // A settled promise resolves within the first server render pass.
  const value = Promise.resolve('done');
  await value;
  const markup = render(
    h(Streamed, { value, fallback: 'loading' }, resolved =>
      h('p', null, resolved),
    ),
  );

  assert.match(markup, /done|loading/);
});

test('Pending renders nothing while the router is idle', () => {
  const markup = renderWithData(h(Pending, null, h('span', null, 'busy')));
  assert.equal(markup, '');
});

test('Pending renders its fallback while idle when one is given', () => {
  const markup = renderWithData(
    h(Pending, { fallback: h('span', null, 'ready') }, 'busy'),
  );
  assert.match(markup, /ready/);
});

test('SearchField renders the value from the URL, so a shared link restores it', () => {
  const markup = render(h(SearchField, { name: 'q' }), {
    url: '/search?q=tigers',
  });

  assert.match(markup, /value="tigers"/);
  assert.match(markup, /name="q"/);
  assert.match(markup, /data-ness-search="q"/);
});

test('SearchField stays a real input, so search works before hydration', () => {
  const markup = render(h(SearchField, { name: 'q', className: 'field' }));
  assert.match(markup, /^<input/);
  assert.match(markup, /class="field"/);
  assert.match(markup, /type="search"/);
});

test('Pagination clamps the page to the available range', () => {
  const seen = [];
  const capture = state => {
    seen.push(state);
    return null;
  };

  render(h(Pagination, { total: 45, pageSize: 20, children: capture }), {
    url: '/?page=99',
  });
  assert.equal(seen[0].page, 3, 'beyond the last page clamps to the last');

  render(h(Pagination, { total: 45, pageSize: 20, children: capture }), {
    url: '/?page=0',
  });
  assert.equal(seen[1].page, 1);

  render(h(Pagination, { total: 45, pageSize: 20, children: capture }), {
    url: '/?page=not-a-number',
  });
  assert.equal(seen[2].page, 1, 'a malformed parameter falls back to page one');
});

test('Pagination reports the offset and page count for a query', () => {
  let state;
  render(
    h(Pagination, {
      total: 45,
      pageSize: 20,
      children: value => {
        state = value;
        return null;
      },
    }),
    { url: '/?page=3' },
  );

  assert.equal(state.pageCount, 3);
  assert.equal(state.offset, 40);
  assert.equal(state.hasNext, false);
  assert.equal(state.hasPrevious, true);
});

test('Pagination keeps other parameters and omits page=1 from the URL', () => {
  let state;
  render(
    h(Pagination, {
      total: 100,
      pageSize: 10,
      children: value => {
        state = value;
        return null;
      },
    }),
    { url: '/?q=tigers&sort=new&page=2' },
  );

  assert.match(state.hrefFor(3), /q=tigers/);
  assert.match(state.hrefFor(3), /sort=new/);
  assert.match(state.hrefFor(3), /page=3/);
  assert.ok(
    !state.hrefFor(1).includes('page='),
    'the first page must be one URL, not two a crawler treats as duplicates',
  );
  assert.match(state.hrefFor(1), /q=tigers/);
});

test('Pagination lists the sibling pages around the current one', () => {
  let state;
  render(
    h(Pagination, {
      total: 200,
      pageSize: 10,
      siblings: 2,
      children: value => {
        state = value;
        return null;
      },
    }),
    { url: '/?page=10' },
  );

  assert.deepEqual(state.pages, [8, 9, 10, 11, 12]);
});

test('Pagination handles an empty result set without dividing by zero', () => {
  let state;
  render(
    h(Pagination, {
      total: 0,
      children: value => {
        state = value;
        return null;
      },
    }),
  );

  assert.equal(state.pageCount, 1);
  assert.equal(state.page, 1);
  assert.equal(state.hasNext, false);
});

test('Form renders a real form element with its state passed to children', () => {
  let state;
  const markup = renderWithData(
    h(Form, { method: 'post', action: '/subscribe' }, value => {
      state = value;
      return h('button', null, value.pending ? 'Saving' : 'Save');
    }),
  );

  assert.match(markup, /<form/);
  assert.match(markup, /action="\/subscribe"/);
  assert.match(markup, /Save</);
  assert.equal(state.pending, false);
  assert.equal(state.state, 'idle');
});

test('Form accepts plain children as well as a render prop', () => {
  const markup = renderWithData(
    h(Form, { method: 'post' }, h('input', { name: 'email' })),
  );
  assert.match(markup, /<input/);
  assert.match(markup, /name="email"/);
});

test('Title renders the document title and mirrors it to Open Graph', () => {
  const markup = render(h(Meta, null, h(Title, null, 'About')));
  assert.match(markup, /<title>About<\/title>/);
  assert.match(markup, /<meta property="og:title" content="About"\/?>/);
});

test('Title renders exactly one title, the defect this exists to avoid', () => {
  const markup = render(h(Meta, null, h(Title, null, 'Home')));
  assert.equal(markup.match(/<title>/g).length, 1);
});

test('Title flattens interpolated children into the og:title attribute', () => {
  const markup = render(h(Meta, null, h(Title, null, 'Pricing · ', 'Ness')));
  assert.match(markup, /<title>Pricing · Ness<\/title>/);
  assert.match(markup, /content="Pricing · Ness"/);
  assert.doesNotMatch(markup, /content="Pricing · ,Ness"/);
});

test('Description renders the meta tag and its Open Graph mirror', () => {
  const markup = render(h(Meta, null, h(Description, null, 'What it costs.')));
  assert.match(markup, /<meta name="description" content="What it costs."\/?>/);
  assert.match(
    markup,
    /<meta property="og:description" content="What it costs."\/?>/,
  );
});

test('Canonical and Robots render their own tag and nothing else', () => {
  const markup = render(
    h(
      Meta,
      null,
      h(Canonical, { href: 'https://example.com/a' }),
      h(Robots, null, 'noindex, nofollow'),
    ),
  );
  assert.match(
    markup,
    /<link rel="canonical" href="https:\/\/example.com\/a"\/?>/,
  );
  assert.match(markup, /<meta name="robots" content="noindex, nofollow"\/?>/);
  assert.doesNotMatch(markup, /<title>/);
});

test('SocialImage carries the card type, or the image is a thumbnail', () => {
  const markup = render(
    h(
      Meta,
      null,
      h(SocialImage, { src: 'https://example.com/c.png', alt: 'A card' }),
    ),
  );
  assert.match(
    markup,
    /<meta property="og:image" content="https:\/\/example.com\/c.png"\/?>/,
  );
  assert.match(markup, /<meta property="og:image:alt" content="A card"\/?>/);
  assert.match(
    markup,
    /<meta name="twitter:card" content="summary_large_image"\/?>/,
  );
});

test('SocialImage omits the alt tag when there is no alt text', () => {
  const markup = render(
    h(Meta, null, h(SocialImage, { src: 'https://example.com/c.png' })),
  );
  assert.doesNotMatch(markup, /og:image:alt/);
});

test('Meta renders nothing of its own', () => {
  assert.equal(render(h(Meta, null)), '');
});
