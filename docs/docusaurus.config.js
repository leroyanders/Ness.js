// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/oceanicNext');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ness.js',

  // themes: ['@docusaurus/theme-search-algolia'],
  tagline: 'Newest Experience of Server Side development. Awesome React framework ✨',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/',

  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',

  organizationName: 'leroywagner', // Usually your GitHub org/user name.
  projectName: 'Ness.js', // Usually your repo name.
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
          breadcrumbs: false,
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/leroywagner/Ness.js/tree/master/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
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
          alt: 'Site Logo',
          src: 'img/favicon.png',
          width: 20,
          height: 20,
        },
        items: [
          {
            to: '/',
            label: 'Newest Experience of Server Side development.',
            className: 'navbar-slogan'
          },
          {
            to: '/docs/templates/your-own-template',
            position: 'right',
            label: "Templates",
          },
          {
            to: '/docs/plugins/your-own-plugin',
            position: 'right',
            label: "Plugins",
          },
          {
            to: '/docs/examples/common',
            position: 'right',
            label: "Examples",
          },
          {
            type: 'doc',
            docId: 'intro',
            position: 'right',
            label: 'Documentation (v4.0.2)',
          },
          {
            href: 'https://github.com/leroywagner/Ness.js',
            position: 'right',
            className: "header-github-link",
            target: '_blank',
          },
        ],
      },
      footer: {
        style: 'light',
        copyright: `Copyright © ${new Date().getFullYear()}, Made with love by Leroy Wagner`,
      },
      prism: {
        theme: darkCodeTheme,
        darkTheme: darkCodeTheme,
      },
      docs: {
        sidebar: {
          hideable: false,
          autoCollapseCategories: true,
        },
      },
    }),
};

module.exports = config;
