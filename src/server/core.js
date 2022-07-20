import Router from '../client/router';
import React from 'react';
import express from 'express';
import { StaticRouter } from 'react-router-dom/server';
import { renderToString } from 'react-dom/server';
import { Helmet } from 'react-helmet';
import { exec } from 'child_process';

// dependencies
const path = require('path');
const server = express();
const nessAplication = server;
const assets = require(process.env.NESS_CHUNKS_MANIFEST);

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
async function sh(cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function main() {
  let { stdout } = await sh('npx tailwindcss -i ./src/styles/global.scss -o ./src/styles/global.css --watch >/dev/null 2>&1');
  
  console.log(stdout);
}

main();

nessAplication.use(express.static(process.env.NESS_PUBLIC_DIR));
nessAplication.set('view engine', 'pug');
nessAplication.set('views', path.join(__dirname, '..', 'views'));

// all routes to client router
nessAplication.get('/*', (req, res) => {
  const context = {};
  const serverRouter = renderToString(
    <StaticRouter location={req.url} isServer={true}>
      <Router isServer={true}/>
    </StaticRouter>
  );
  const metadata = Helmet.renderStatic();
  const meta = metadata.meta.toComponent()
  const title = metadata.title.toComponent();
  const manifest = renderToString(meta) + renderToString(title);

  if (context.url) res.redirect(context.url);
  else res.status(200).render('index', {
      metadata: manifest,
      production: process.env.NODE_ENV === 'production',
      clientStyles: assets.client.css.filter(chunk => !chunk.includes('.map')),
      bundledScript: assets.client.js.filter(chunk => !chunk.includes('.map')),
      body: serverRouter,
    })
  }
);

export default nessAplication;