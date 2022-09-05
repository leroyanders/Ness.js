# Client side rendering

Ness.js using custom render function to render the client side, which is pass two arguments, Router component and container.

:::caution Please don't use React DOM Router
It will conflict with Ness.js core. Server and client side rendering functions required.
:::

## Render function

Use the following package to configure client routes.

```jsx title='Use this rendering engine to render'
import render from 'nessapp/client/dom'
```

## Example of usage

```javascript title='./src/client/index.js' showLineNumbers
import React from 'react';
import { Router } from '../router';
import render from 'nessapp/client/dom'

// prefer to use this instead classic React DOM function,
render(<Router/>, document.getElementById('root'));

// hot reload the components
if (module.hot) module.hot.accept(() => root.unmount());
```
