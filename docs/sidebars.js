/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */

const sidebars = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: true,
      items: [
        'getting-started/create-new-app',
        'getting-started/commands',
        'getting-started/update-app',
      ],
    },
    {
      type: 'category',
      label: 'Plugins',
      collapsed: true,
      items: [
        'plugins/tailwind',
        'plugins/your-own-plugin',
      ],
    },
    {
      type: 'category',
      label: 'Templates',
      collapsed: true,
      items: [
        'templates/your-own-template',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: [
        'examples/common',
      ],
    },
    {
      type: 'category',
      label: 'Documentation',
      collapsed: true,
      items: [
        'documentation/router',

        'documentation/client/render',
        'documentation/server/render',
        
        'documentation/data-fetching',
        'documentation/styling',

        'documentation/config',
      ],
    },
    'code-of-conduct',
    'supporting',
    'how-to-contribute'
  ],
};

module.exports = sidebars;
