# Route system

We want to be able to provide a best performance of routing, so you don't have to worry about react versions difference router-dom. This way will be actual forever.

:::caution Path to the router
Path to the router always must be absolute and by this path `./src/router.js`, don't move the router and don't change the name of file.
:::

## Example usage

Use the following package to configure client routes.

```jsx title='Use this rendering engine to render'
import { renderRoutes } from 'nessapp/client/dom';
```

1. Define all routes as the following example. Route must have path and component property. Property `exact` will be ignored if path passed as RegExp.

```jsx showLineNumbers
// pages
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Routes
const Routes = [
  {
    component: Home,
    path: '/',
    exact: true
  },
  {
    component: NotFound,
    path: '/*',
  },
];
```

2. Initialize client-side router

```jsx showLineNumbers
import { renderRoutes } from 'nessapp/client/dom';

const Routes = [...];

export function Router() {
  return renderRoutes(Routes)
}

export default Routes;
```
