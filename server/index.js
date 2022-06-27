const path = require('path');
const cors = require('cors');
const express = require('express');
const webpack = require('webpack');
const PORT = 3000;
const app = express();
const webpackConfig = require('../webpack.config');
const webpackCompiler = webpack(webpackConfig);
const http = require('http');

require('ignore-styles');
require('@babel/register')({
    configFile: path.resolve( __dirname, '../babel.config.js' ),
});
require('@babel/core').transformSync('code', {
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

// cors configuration
app.use(cors({
  origin: `http://localhost:${PORT}`,
}));

// middleware configurations
app.use(
   require('webpack-dev-middleware')(webpackCompiler, {
     noInfo: true,
     publicPath: webpackConfig.output.publicPath,
    }),
);
app.use(
   require('webpack-hot-middleware')(webpackCompiler, {
     log: false,
     path: '/reloadapp',
   }),
);

// engine configurations
app.use('/static', express.static('deploy'));
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

// ignore routes that don't exist in the config
app.get('/static/css/main.css', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..') + '/deploy/css/' + 'build.css');
});
app.get('/static/.hot/hot-update.json', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..') + '/deploy/js/.hot/' + 'hot-update.json');
})
app.get('/static/.hot/hot-update.js', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..') + '/deploy/js/.hot/' + 'hot-update.js');
})

// react routes that will mounted server side
require('./routes.js')(app, PORT);

// start server and connect to hot-reloader

app.listen(PORT, () => {
  console.log(`The server is listening on port ${PORT}.`);
});