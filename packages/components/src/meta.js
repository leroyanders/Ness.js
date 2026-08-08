import { createElement, Fragment } from 'react';

/**
 * A page's metadata, declared where the page is.
 *
 * React hoists `<title>`, `<meta>` and `<link>` into `<head>` from anywhere in
 * the tree, so a route states its own metadata in its own markup instead of
 * exporting a `meta` function for some other component to render.
 *
 *   <Meta>
 *     <Title>Pricing</Title>
 *     <Description>What it costs.</Description>
 *     <Canonical href="https://example.com/pricing" />
 *   </Meta>
 *
 * `Meta` groups them and renders nothing of its own. The grouping is the point:
 * metadata otherwise scatters through a component's markup, and one block at the
 * top of the return is the difference between reading a page's metadata and
 * hunting for it.
 */
function Meta({ children }) {
  return createElement(Fragment, null, children);
}

/**
 * The document title, and the title a link preview shows.
 *
 * Render one per page and none in a shared layout. React does not deduplicate
 * `<title>`: two reach the document and the browser takes the first, so a title
 * in a layout silently wins over every page's own.
 */
function Title({ children }) {
  // Flattened, not passed through. React renders `<title>` empty when given
  // more than one child, and `<Title>Pricing · {siteName}</Title>` is two —
  // so interpolating anything into a title would silently erase it.
  const title = text(children);
  return createElement(
    Fragment,
    null,
    createElement('title', null, title),
    createElement('meta', { property: 'og:title', content: title }),
  );
}

/** The sentence a search result and a link preview show under the title. */
function Description({ children }) {
  const content = text(children);
  return createElement(
    Fragment,
    null,
    createElement('meta', { name: 'description', content }),
    createElement('meta', { property: 'og:description', content }),
  );
}

/**
 * The address this page should be indexed under.
 *
 * Give it an absolute URL. A page reachable at more than one path — with a
 * tracking parameter, with and without a trailing slash — is otherwise counted
 * as several pages that each rank on their own.
 */
function Canonical({ href }) {
  return createElement('link', { rel: 'canonical', href });
}

/** Crawler instructions, for example `noindex, nofollow`. */
function Robots({ children }) {
  return createElement('meta', { name: 'robots', content: text(children) });
}

/**
 * The image a link preview shows.
 *
 * The card type travels with it: without one, a large image is served as a
 * small thumbnail.
 */
function SocialImage({ src, alt }) {
  return createElement(
    Fragment,
    null,
    createElement('meta', { property: 'og:image', content: src }),
    alt == null
      ? null
      : createElement('meta', { property: 'og:image:alt', content: alt }),
    createElement('meta', {
      name: 'twitter:card',
      content: 'summary_large_image',
    }),
  );
}

/**
 * `content` is an attribute, so it has to be a string.
 *
 * Children reach here as an array whenever JSX interpolates — `<Title>Pricing ·
 * {siteName}</Title>` arrives as two nodes — and passing that array through
 * would render `content="Pricing · ,Ness"`.
 */
function text(children) {
  return Array.isArray(children) ? children.join('') : String(children ?? '');
}

export { Canonical, Description, Meta, Robots, SocialImage, Title };
