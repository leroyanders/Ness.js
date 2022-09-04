# Server side rendering

Ness.js use Express.js on the server side, [see more about Express.js](https://expressjs.com/en/guide/routing.html). Server side also using custom render function `useServerRendering` to render the server side rendering, you can pass any data to client side.

## useServerRendering

```jsx title='Use this rendering engine to render'
import { useServerRendering } from 'nessapp/server/dom';
```

## Example of usage

```jsx title='./src/index.js'
import express from 'express';
import { useServerRendering } from 'nessapp/server/dom';
import Routes from './router';

// Create a server
const server = express();
const assets = require(process.env.NESS_CHUNKS_MANIFEST);

// All routes to one point
server.get('*', (request, response) => useServerRendering({
  // response & request handlers
  request: request,
  response: response,

  // routes & assets
  routes: Routes,
  assets: assets,

  // store & current server state
  server: server,
  store: {
    application: {
      name: 'Ness.js'
    }
  },

  // deploy mode (development/production)
  production: process.env.NODE_ENV === 'production',
}));

export default server;
```
