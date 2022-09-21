## Ness.js  
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/leroywagner/Ness.js/license)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![Ness Version](https://img.shields.io/badge/v4.5.76-Ness.js-blue)]()
[![Ness Version](https://img.shields.io/badge/Contribute%20with-Gitpod-908a85?logo=gitpod)]()

<i>

Ness.js - is an **open source** framework based on React.js, Express.js and Webpack, supports both-side rendering.

It support installing our plugins and plugins from your application ```source```, will save your development time and provide more-userful experience.

</i>

## Documentation

You can find the Ness.js documentation [on the framework website](https://nessapp.vercel.com/).  

Check out the [Getting Started](https://nessapp.vercel.app/docs/getting-started) page for a quick overview.

* [Tutorial](https://nessapp.vercel.app/docs/tutorial)
* [Main Concepts](https://nessapp.vercel.app/docs/hello-world)
* [Advanced Guides](https://nessapp.vercel.app/docs/advanced)
* [API Reference](https://nessapp.vercel.app/docs/api)
* [Where to Get Support](https://nessapp.vercel.app/community/support)
* [Contributing Guide](https://nessapp.vercel.app/docs/how-to-contribute)

## Examples

We have several examples [on the website](https://nessapp.vercel.app/). 

Here is the first one to get you started:

```jsx
import React from 'react';
import { Router } from '../router';
import render from 'nessapp/client/dom'

render(<Router/>, document.getElementById('root'));

// hot reload the components
if (module.hot) module.hot.accept(() => root.unmount());
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

<br/>

### License

Ness.js is under [MIT license](./license).