const path = require('path');
const cors = require('cors');
const express = require('express');
const webpack = require('webpack');
const PORT = 3000;
const app = express();
const webpackConfig = require('../webpack.config');
const webpackCompiler = webpack(webpackConfig);

app.use(cors('*'));
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
app.use('/static', express.static('deploy'));

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

// routes
require('./routes')(app)

app.listen(PORT, () => {
  console.log(`The server is listening on port ${PORT}.`);
});
