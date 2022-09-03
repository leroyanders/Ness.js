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
      ],
    },
    'code-of-conduct',
    'supporting',
    'how-to-contribute'
  ],
};

module.exports = sidebars;
