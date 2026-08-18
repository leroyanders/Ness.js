/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/create-new-app',
        {
          type: 'category',
          label: 'CLI commands',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'getting-started/commands',
          },
          items: [
            'getting-started/commands/new',
            'getting-started/commands/dev',
            'getting-started/commands/build',
            'getting-started/commands/start',
            'getting-started/commands/bundle',
            'getting-started/commands/migrate',
            'getting-started/commands/generate',
            'getting-started/commands/add',
            'getting-started/commands/remove',
            'getting-started/commands/update',
            'getting-started/commands/clean',
            'getting-started/commands/typegen',
            'getting-started/commands/routes',
            'getting-started/commands/reveal',
            'getting-started/commands/doctor',
            'getting-started/commands/info',
          ],
        },
        'getting-started/update-app',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'documentation/packages',
        'documentation/router',
        'documentation/data-fetching',
        'documentation/rsc',
        'documentation/components',
        'documentation/nest',
        'documentation/client/render',
        'documentation/server/render',
        'documentation/caching',
        'documentation/performance',
        'documentation/i18n',
        'documentation/errors',
        'documentation/assets',
        'documentation/styling',
        'documentation/config',
        'documentation/deployment',
        'documentation/migrating-from-next',
      ],
    },
    {
      type: 'category',
      label: 'Ecosystem',
      collapsed: true,
      items: [
        'templates/index',
        'templates/your-own-template',
        'plugins/index',
        'plugins/nest',
        'plugins/tailwind',
        'plugins/security',
        'plugins/env',
        'plugins/compression',
        'plugins/analyzer',
        'plugins/your-own-plugin',
      ],
    },
    {
      type: 'category',
      label: 'Project',
      collapsed: true,
      items: ['supporting', 'how-to-contribute', 'code-of-conduct'],
    },
  ],
};

export default sidebars;
