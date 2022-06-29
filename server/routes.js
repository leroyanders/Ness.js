module.exports = (app, PORT) => {
  const React = require('react');
  const ReactDOMServer = require('react-dom/server');
  const he = require('he');
  const { Router } = require('../client/router'); 

  const Titles = {
    '/': 'Welcome to Ness.js'
  }

  app.get('/', (req, res) => {
    const htmlString = ReactDOMServer.renderToString(<Router ssrLocation={req.url} isServer={true}/>);

    res.render('index', {
      title: Titles[req.url],
      component: he.unescape(htmlString)
    });
  });
}