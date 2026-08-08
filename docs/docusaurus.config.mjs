// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The navbar badge, read from the framework rather than written out here.
 *
 * Major and minor only — the badge names the line the documentation describes,
 * and a patch would change it on every release without changing what it means.
 */
function frameworkVersion() {
  const manifest = JSON.parse(
    readFileSync(
      new URL('../packages/core/package.json', import.meta.url),
      'utf8',
    ),
  );
  const [major, minor] = manifest.version.split('.');
  return `v${major}.${minor}`;
}
// Syntax highlighting stays inside the site's two hues — warm for keywords and
// literals, cool for strings — because a rainbow theme would be a third palette
// on the page and would drown the one distinction that carries meaning here.
// prism-react-renderer writes inline styles, so this cannot be done in CSS.
function nessPrismTheme({ background, plain, muted, warm, cool, strong }) {
  return {
    plain: { color: plain, backgroundColor: background },
    styles: [
      {
        types: ['comment', 'prolog', 'cdata'],
        style: { color: muted, fontStyle: 'italic' },
      },
      { types: ['punctuation', 'operator'], style: { color: muted } },
      {
        types: ['keyword', 'atrule', 'rule', 'important', 'selector'],
        style: { color: warm },
      },
      {
        types: ['string', 'char', 'attr-value', 'regex', 'url'],
        style: { color: cool },
      },
      {
        types: ['number', 'boolean', 'constant', 'symbol'],
        style: { color: warm },
      },
      {
        types: ['function', 'class-name', 'tag', 'builtin'],
        style: { color: strong },
      },
      {
        types: ['property', 'attr-name', 'variable', 'parameter'],
        style: { color: plain },
      },
      { types: ['deleted'], style: { color: warm } },
      { types: ['inserted'], style: { color: cool } },
    ],
  };
}

const nessLight = nessPrismTheme({
  background: '#ffffff',
  plain: '#3d4552',
  muted: '#8b94a3',
  warm: '#a2560c',
  cool: '#0b6b7d',
  strong: '#10131a',
});

const nessDark = nessPrismTheme({
  background: '#0f141b',
  plain: '#b3bcc9',
  muted: '#6c7789',
  warm: '#e0a154',
  cool: '#58c4d8',
  strong: '#e9edf4',
});

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ness.js',
  tagline: 'The full-stack React framework built on Web APIs.',
  url: 'https://nessjs.com',
  baseUrl: '/',
  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
      type: 'text/css',
    },
  ],

  onBrokenLinks: 'ignore',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  favicon: 'img/favicon.ico',

  /*
   * `favicon` above emits only the .ico. The rest of the icon set is rendered
   * by scripts/assets/logo.mjs and has to be declared, or a browser that would
   * prefer the SVG and an iOS home screen that wants the touch icon both fall
   * back to the 16px bitmap.
   */
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/img/logo.svg',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/img/favicon-32x32.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/img/favicon-16x16.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/img/apple-touch-icon.png',
      },
    },
  ],

  organizationName: 'leroyanders',
  projectName: 'Ness.js',
  deploymentBranch: 'master',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'content',
          breadcrumbs: false,
          sidebarPath: fileURLToPath(
            new URL('./sidebars.mjs', import.meta.url),
          ),
          editUrl: 'https://github.com/leroyanders/Ness.js/tree/master/docs/',
        },
        theme: {
          customCss: fileURLToPath(
            new URL('./src/css/custom.css', import.meta.url),
          ),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'Ness.js',
        /*
         * The same file the browser tab gets. The mark carries its own disc, so
         * it needs no variant per surface: on the light navbar the disc reads as
         * the mark, and on the dark one it recedes into the background and the
         * white letter carries it alone.
         */
        logo: {
          alt: '',
          src: 'img/logo.svg',
          width: 28,
          height: 28,
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: '/docs/getting-started/create-new-app',
            position: 'left',
            label: 'Quick start',
          },
          {
            to: '/docs/documentation/router',
            position: 'left',
            label: 'App Router',
          },
          {
            to: '/docs/documentation/deployment',
            position: 'left',
            label: 'Deployment',
          },
          {
            to: '/docs/plugins',
            position: 'left',
            label: 'Plugins',
          },
          {
            position: 'right',
            label: frameworkVersion(),
            className: 'navbar-version',
            to: '/docs/intro',
          },
          {
            href: 'https://github.com/leroyanders/Ness.js',
            position: 'right',
            className: 'header-github-link',
            target: '_blank',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Framework',
            items: [
              {
                label: 'Quick start',
                to: '/docs/getting-started/create-new-app',
              },
              { label: 'App Router', to: '/docs/documentation/router' },
              { label: 'Caching', to: '/docs/documentation/caching' },
            ],
          },
          {
            title: 'Resources',
            items: [
              { label: 'CLI commands', to: '/docs/getting-started/commands' },
              { label: 'Templates', to: '/docs/templates/your-own-template' },
              { label: 'Plugins', to: '/docs/plugins' },
            ],
          },
          {
            title: 'Project',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/leroyanders/Ness.js',
              },
              { label: 'Contributing', to: '/docs/how-to-contribute' },
              { label: 'Code of conduct', to: '/docs/code-of-conduct' },
            ],
          },
        ],
        copyright: `Released under the MIT License · Copyright © ${new Date().getFullYear()} Ness.js`,
      },
      prism: {
        theme: nessLight,
        darkTheme: nessDark,
      },
      docs: {
        sidebar: {
          hideable: false,
          autoCollapseCategories: true,
        },
      },
    }),
};

export default config;
