'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  install(config, plugin_options) {
    let rules = [];

    const IS_NODE = plugin_options.target === 'node';
    const IS_WEB = plugin_options.target === 'web';
    const IS_PRODUCTION = plugin_options.env === 'prod';
    const IS_DEVELOPMENT = plugin_options.env === 'dev';
    const devMode = process.env.NODE_ENV !== 'production';

    config.module.rules.map(function(rule) {
      if (rule.test) {
        if (rule.test instanceof RegExp) {
          if('.scss'.match(new RegExp(rule.test)) || '.sass'.match(new RegExp(rule.test))) {
            return
          }
        }
      }

      rules.push(rule);
    });

    config.module.rules = [
      ...rules,
      {
        test: /\.s[ac]ss$/i,
        use: IS_WEB? [
          devMode? 'style-loader' : MiniCssExtractPlugin.loader,
          // Compiles Sass to CSS
          "css-loader",
          // Translates CSS into CommonJS
          { 
            loader: 'postcss-loader', 
            options: {
              postcssOptions: {
                plugins: [
                  require('postcss-import'),
                  require('tailwindcss')({config: plugin_options.config}),
                  require('autoprefixer'),
                  require('cssnano')({
                      preset: 'default',
                  }),
                ],
              }
            }
          },
          "sass-loader",
        ] : [
          // Creates `style` nodes from JS strings
          {
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
              emitFile: IS_WEB
            }
          },
          // Compiles Sass to CSS
          "sass-loader",
        ]
      },
    ];

    return config;
  }
};