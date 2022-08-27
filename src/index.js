import Router from './router';
import React from 'react';
import express from 'express';

// react dependencies
import { StaticRouter } from 'react-router-dom/server';
import { renderToString } from 'react-dom/server';
import { Helmet } from 'react-helmet';

// server & assets
const path = require('path');
const server = express();
const nessAplication = server;
const assets = require(process.env.NESS_CHUNKS_MANIFEST);

// server configuration
nessAplication.use(express.static(process.env.NESS_PUBLIC_DIR));
nessAplication.set('view engine', 'pug');
nessAplication.set('views', path.join(__dirname, '..', 'views'));

// all routes to client router
nessAplication.get('/*', async (req, res) => {
  const context = {};
  const serverRouter = renderToString(
    <StaticRouter location={req.url}>
      <Router/>
    </StaticRouter>
  );

  const metadata = Helmet.renderStatic();
  const meta = metadata.meta.toComponent()
  const title = metadata.title.toComponent();
  const manifest = renderToString(meta) + renderToString(title);

  if (context.url) res.redirect(context.url);
  else res.status(200).render('index', {
      // metadata
      metadata: manifest,
      production: process.env.NODE_ENV === 'production',
      // body of the response
      clientStyles: assets.client.css.filter(chunk => !chunk.includes('.map')),
      bundledScript: assets.client.js.filter(chunk => !chunk.includes('.map')),
      body: serverRouter,
      // content    
      __context__: `window.__context__ = ${JSON.stringify({})}`
    })
  }
);

export default nessAplication;