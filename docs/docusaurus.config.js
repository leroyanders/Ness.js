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

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',

  organizationName: 'leroywagner', // Usually your GitHub org/user name.
  projectName: 'Ness.js', // Usually your repo name.

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
          // lastVersion: 'current',
          // versions: {
          //   current: {
          //     label: 'Stable 4.0.2',
          //     path: '4.0.2',
          //   },
          // },
          breadcrumbs: false,
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
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
      // algolia: {
      //   contextualSearch: false,
      //   appId: 'YOUR_APP_ID',

      //   // Public API key: it is safe to commit it
      //   apiKey: 'YOUR_SEARCH_API_KEY',

      //   indexName: 'YOUR_INDEX_NAME',

      //   // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
      //   externalUrlRegex: 'external\\.com|domain\\.com',

      //   // Optional: Algolia search parameters
      //   searchParameters: {},

      //   // Optional: path for search page that enabled by default (`false` to disable it)
      //   searchPagePath: 'search',

      //   //... other Algolia params
      // },
      navbar: {
        title: 'Ness.js',
        items: [
          {
            to: '/',
            label: 'Newest Experience of Server Side development.',
            className: 'navbar-slogan'
          },
          // {
          //   type: 'docsVersionDropdown',
          //   position: 'right',
          //   dropdownItemsAfter: [{to: '/versions', label: 'All versions'}],
          //   dropdownActiveClassDisabled: true,
          // },
          {
            to: '/',
            position: 'right',
            label: "Dashboard",
            target: '_blank',
          },
          {
            type: 'doc',
            docId: 'intro',
            position: 'right',
            label: 'Documentation',
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
