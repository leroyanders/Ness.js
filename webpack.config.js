const path = require('path');
const webpack = require('webpack');
const filePath = path.join(__dirname, './deploy/js/');
const fileName = 'bundle.js';
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',

  entry: ['./client/index.js', 'webpack-hot-middleware/client'],
  devtool: "inline-source-map",

  output: {
    publicPath: '/static/',
    path: '/deploy/',
    filename: fileName,
    hotUpdateChunkFilename: "./.hot/[id].[hash].hot-update.js",
    hotUpdateMainFilename: "./.hot/[hash].hot-update.json"
  },
  resolve: {
    extensions: [
      '.js','.jsx'
    ]
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react'
            ],
            plugins: [
              ['@babel/plugin-proposal-decorators', { "legacy": true }],
            ]
          },
        }
      },
      {
        test: /\.css$/,
        use: [ 
          { loader: "style-loader" },  // to inject the result into the DOM as a style block
          { loader: "css-modules-typescript-loader"},  // to generate a .d.ts module next to the .scss file (also requires a declaration.d.ts with "declare modules '*.scss';" in it to tell TypeScript that "import styles from './styles.scss';" means to load the module "./styles.scss.d.td")
          { loader: "css-loader", options: { modules: true } },  // to convert the resulting CSS to Javascript to be bundled (modules:true to rename CSS classes in output to cryptic identifiers, except if wrapped in a :global(...) pseudo class)
          { loader: "sass-loader" },  // to convert SASS to CSS
        ] 
      },
      { 
        test: /\.s[ac]ss$/i, 
        use: [
          { loader: "style-loader" }, // to inject the result into the DOM as a style block
          { loader: "css-modules-typescript-loader"}, // to generate a .d.ts module next to the .scss file (also requires a declaration.d.ts with "declare modules '*.scss';" in it to tell TypeScript that "import styles from './styles.scss';" means to load the module "./styles.scss.d.td")
          { loader: "css-loader", options: { modules: true, importLoaders: 1, sourceMap: true} },  // to convert the resulting CSS to Javascript to be bundled (modules:true to rename CSS classes in output to cryptic identifiers, except if wrapped in a :global(...) pseudo class)
          { loader: "sass-loader" }, // to convert SASS to CSS
          { loader: 'postcss-loader' } // to generate CSS files
        ] 
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            options: {
              bypassOnDebug: true, // webpack@1.x
              disable: true, // webpack@2.x and newer
            },
          },
        ],
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("development"),
      },
    }),
    new HtmlWebpackPlugin()
  ],
  devServer: {
    hot: true
  }
};