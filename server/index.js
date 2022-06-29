const path = require('path');
const cors = require('cors');
const express = require('express');
const PORT = 3000;
const app = express();

require('ignore-styles');
require('@babel/register')({
    configFile: path.resolve( __dirname, '../babel.config.js' ),
});
require('@babel/core').transformSync('code', {
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

if(process.env.NODE_ENV === "development") {
  const webpack = require("webpack")
  const webpackConfig = require("../webpack.config")
  const compiler = webpack(webpackConfig)

  app.use(
    require("webpack-dev-middleware")(compiler, {
      noInfo: true,
      publicPath: webpackConfig.output.publicPath,
    })
  )

  app.use(require("webpack-hot-middleware")(compiler))
}

// cors configuration
app.use(cors({
  origin: `http://localhost:${PORT}`,
}));

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