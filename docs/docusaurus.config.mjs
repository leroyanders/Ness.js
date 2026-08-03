// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import { fileURLToPath } from 'node:url';
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ness.js',
  tagline: 'The full-stack React framework built on Web APIs.',
  url: 'https://nessjs.com',
  baseUrl: '/',
  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@500;600;700;800&display=swap',
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
        logo: {
          alt: 'Ness.js logo',
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
            label: 'v6.0',
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
        theme: prismThemes.github,
        darkTheme: prismThemes.vsDark,
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
