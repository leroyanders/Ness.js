module.exports = (app, PORT) => {
  const React = require('react');
  const ReactDOMServer = require('react-dom/server');
  const he = require('he');
  const { Router } = require('../client/router'); 

  app.all('*', (req, res) => {
    const htmlString = ReactDOMServer.renderToString(<Router ssrLocation={req.url} isServer={true}/>);

    res.render('index', {
      title: 'Welcome to Ness.js',
      component: he.unescape(htmlString)
    });
  });
}