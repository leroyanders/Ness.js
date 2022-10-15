<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/106757584/188333735-fe92e2d8-faea-4405-8fab-b77cd32781ac.svg">
    <img src="https://user-images.githubusercontent.com/106757584/188333666-5ee6f31f-0672-411e-b59e-db6c518e0e70.svg">
  </picture>
</p>

## Ness.js
[![Build Status][build-badge]][build] [![Version][version-badge]][package] [![MIT License][license-badge]][license] [![PRs Welcome][prs-welcome-badge]][prs-welcome]

### About

*Ness.js - is an **open source** framework based on React.js, Express.js and Webpack, supports both-side rendering. Supports installing our plugins and plugins from your application directly, will save your development time and provide more-userful experience.*

## Documentation

- [Getting Started](./docs/docs/getting-started/create-new-app.md)
- [Commands](./docs/docs/getting-started/commands.md)
- [Plugins](./docs/docs/plugins/your-own-plugin.md)
- [Templates](./docs/docs/templates/your-own-template.md)
- [Examples](./docs/docs/examples/common.md)

You can find full documentation [on the official website](https://nessapp.vercel.com/).  

## Firts view

We have several examples [on the website](https://nessapp.vercel.app/). 

Here is the first one to get you started:

```jsx
import React from 'react';
import { Router } from '../router';
import { 
  render, 
  useRefresh, 
  useRoot, 
  useContainer 
} from 'nessapp/client/dom';

render({
  document: useRoot(<Router/>), 
  root: useContainer(document.getElementById('root')), 
  module: useRefresh(module)
});
```

This example will render page based your route into a container on the page.

We're using custom render function instead of classical React DOM render to provide you both-side data fetching.

## Contributing

The main purpose of this repository is to continue evolving React core, making it faster and easier to use. Development of Ness.js happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving Ness.

### Code of Conduct

We has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text on website](https://nessapp.vercel.app/code-of-conduct) so that you can understand what actions will and will not be tolerated.

### Contributing Guide

Read our [contributing guide](https://nessapp.vercel.app/docs/how-to-contribute) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Ness.

### Good First Issues

To help you get your feet wet and get you familiar with our contribution process, we have a list of [good first issues](https://github.com/leroywagner/Ness.js/issues/new) that contain bugs that have a relatively limited scope. This is a great place to get started.

### License

Everything inside this repository is [MIT licensed](./license).


<!-- badges -->

[build-badge]: https://img.shields.io/circleci/project/github/nessapp/master.svg?style=flat-square
[build]: https://circleci.com/gh/nessapp/tree/master
[version-badge]: https://img.shields.io/npm/v/nessapp.svg?style=flat-square
[package]: https://www.npmjs.com/package/nessapp
[license-badge]: https://img.shields.io/npm/l/nessapp?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[lean-core-badge]: https://img.shields.io/badge/Lean%20Core-Extracted-brightgreen.svg?style=flat-square
