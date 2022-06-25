const path = require('path');
const webpack = require('webpack');
const filePath = path.join(__dirname, './deploy/js/');
const fileName = 'bundle.js';
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    app: [
      path.join(__dirname, 'client/index.tsx'), `webpack-hot-middleware/client?path=/reloadapp&reload=true`,
    ],
  },
  output: {
    publicPath: '/static/js/',
    path: filePath,
    filename: fileName,
    hotUpdateChunkFilename: '.hot/hot-update.js',
    hotUpdateMainFilename: '.hot/hot-update.json',
  },
  watchOptions: {
    ignored: [
      '/node_modules/',
    ],
  },
  resolve: {
    extensions: [
      '.js','.jsx','.tsx','.css'
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
          // NOTE: The first build after adding/removing/renaming CSS classes fails, since the newly generated .d.ts typescript module is picked up only later
        ] 
      },
      { 
        test: /\.s[ac]ss$/i, 
        use: [
          { loader: "style-loader" },  // to inject the result into the DOM as a style block
          { loader: "css-modules-typescript-loader"},  // to generate a .d.ts module next to the .scss file (also requires a declaration.d.ts with "declare modules '*.scss';" in it to tell TypeScript that "import styles from './styles.scss';" means to load the module "./styles.scss.d.td")
          { loader: "css-loader", options: {
            modules: true,
            importLoaders: 1,
            sourceMap: true
          } },  // to convert the resulting CSS to Javascript to be bundled (modules:true to rename CSS classes in output to cryptic identifiers, except if wrapped in a :global(...) pseudo class)
          { loader: "sass-loader" },  // to convert SASS to CSS
          { loader: 'postcss-loader' }
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
    // Extract any CSS from any javascript file to process it as LESS/SASS using a loader
    new MiniCssExtractPlugin({
        filename: "[name].bundle.css"
    }),

    // Use BrowserSync plugin for file changes. I.e. if a CSS/SASS/LESS file changes, the changes will be injected directly in the browser with no page load
    // new BrowserSyncPlugin({
    //     proxy: '127.0.0.1:3000',
    //     open: 'external',
    //     host: '127.0.0.1:3000',
    //     port: 3000,
    //     files: ['./dist/main.css', './views', './tailwind.js']
    // },
    // {
    //     // disable reload from the webpack plugin since browser-sync will handle CSS injections and JS reloads
    //     reload: false
    // }),
  
    new HtmlWebpackPlugin({ template: './views/index.pug' })
  ],
  devServer: {
    static: 'client/styles',
    watchContentBase: true,
  },
};