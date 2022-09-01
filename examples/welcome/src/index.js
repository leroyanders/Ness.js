import { useServerRendering } from 'nessapp/server/dom';
import Routes from './router';
import express from 'express';

// server & assets
const path = require('path');
const server = express();
const nessAplication = server;
const assets = require(process.env.NESS_CHUNKS_MANIFEST);

// server configuration
nessAplication.use(express.static(process.env.NESS_PUBLIC_DIR));
nessAplication.set('view engine', 'pug');
nessAplication.set('views', path.join(__dirname, '..', 'views'));

nessAplication.get('*', (request, response) => useServerRendering({
  // response & request handlers
  request: request,
  response: response,
  // routes & assets
  routes: Routes,
  assets: assets,
  // store & current server state
  server: nessAplication,
  store: {
    application: {
      name: 'Ness.js'
    }
  },
  // deploy mode (development/production)
  production: process.env.NODE_ENV === 'production',
}))

export default nessAplication;