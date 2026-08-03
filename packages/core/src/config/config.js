import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import AssetsPlugin from 'assets-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import fs from 'fs-extra';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import StartServerPlugin from 'start-server-nestjs-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import nodeExternals from 'webpack-node-externals';
import { clientEnvironment } from './env.js';
import modules from './modules.js';
import paths from './paths.js';
import runPlugin from './plugin.js';

const babelPreset = fileURLToPath(
  new URL('../babel/index.js', import.meta.url),
);

const assetPattern =
  /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|eot|otf|ttf|woff2?|mp3|mp4|ogg|webm)$/i;

function makeLoaderFinder(loaderName) {
  return rule => {
    const loaders = [
      rule.loader,
      ...(Array.isArray(rule.use) ? rule.use : []),
    ].filter(Boolean);
    return loaders.some(loader => {
      const name = typeof loader === 'string' ? loader : loader.loader;
      return (
        typeof name === 'string' &&
        (name === loaderName || name.includes(`/${loaderName}/`))
      );
    });
  };
}

const babelLoaderFinder = makeLoaderFinder('babel-loader');

function createStyleLoaders({ isWeb, isDevelopment, sass }) {
  const cssLoader = {
    loader: 'css-loader',
    options: {
      importLoaders: sass ? 2 : 1,
      modules: {
        auto: /\.module\./i,
        localIdentName: isDevelopment
          ? '[name]__[local]__[hash:base64:5]'
          : '[hash:base64:8]',
      },
    },
  };

  if (!isWeb) {
    return [cssLoader, ...(sass ? ['sass-loader'] : [])];
  }

  return [
    isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
    cssLoader,
    {
      loader: 'postcss-loader',
      options: { postcssOptions: { plugins: [] } },
    },
    ...(sass ? ['sass-loader'] : []),
  ];
}

function createEntrypointManifest(publicPath, seed, _files, entrypoints) {
  const base = publicPath.endsWith('/') ? publicPath : `${publicPath}/`;
  return Object.entries(entrypoints).reduce((manifest, [name, entryFiles]) => {
    const normalized = entryFiles.map(file =>
      file.startsWith('http') || file.startsWith('/') ? file : `${base}${file}`,
    );
    manifest[name] = {
      css: normalized.filter(file => file.endsWith('.css')),
      js: normalized.filter(file => file.endsWith('.js')),
    };
    return manifest;
  }, seed);
}

async function createConfig(
  target = 'web',
  environment = 'dev',
  options = {},
  _webpack,
  useOnlyForClient = false,
) {
  const {
    clearConsole = true,
    host = 'localhost',
    port = 3000,
    plugins = [],
    modifybabelConfiguration,
  } = options || {};

  const isNode = target === 'node';
  const isWeb = target === 'web';
  const isProduction = environment === 'prod';
  const isDevelopment = !isProduction;

  if (!isNode && !isWeb) throw new Error(`Unsupported build target: ${target}`);
  process.env.NODE_ENV = isProduction ? 'production' : 'development';

  const dotenv = clientEnvironment(target, { clearConsole, host, port });
  const portOffset = useOnlyForClient ? 0 : 1;
  const configuredPort = Number.parseInt(process.env.PORT, 10);
  const devServerPort = Number.isFinite(configuredPort)
    ? configuredPort + portOffset
    : port + portOffset;
  const publicPath =
    dotenv.raw.CLIENT_PUBLIC_PATH ||
    (isDevelopment
      ? `http://${dotenv.raw.HOST}:${devServerPort}/`
      : dotenv.raw.PUBLIC_PATH || '/');
  const externalModuleDirectories = [
    paths.nodeModulesDirectory,
    paths.ownNodeModules,
  ].filter(
    (directory, index, directories) =>
      fs.existsSync(directory) && directories.indexOf(directory) === index,
  );

  const hasBabelRc = fs.existsSync(paths.babelConfigPath);
  let babelConfiguration = {
    babelrc: hasBabelRc,
    configFile: false,
    cacheDirectory: true,
    presets: hasBabelRc ? [] : [babelPreset],
    plugins: isWeb && isDevelopment ? ['react-refresh/babel'] : [],
  };

  if (typeof modifybabelConfiguration === 'function') {
    babelConfiguration =
      modifybabelConfiguration(babelConfiguration, {
        target,
        dev: isDevelopment,
      }) || babelConfiguration;
  }

  let config = {
    name: target,
    mode: isDevelopment ? 'development' : 'production',
    context: paths.applicationDirectory,
    target,
    devtool: isDevelopment ? 'eval-cheap-module-source-map' : 'source-map',
    stats: 'errors-warnings',
    resolve: {
      modules: [
        paths.nodeModulesDirectory,
        paths.ownNodeModules,
        'node_modules',
        ...(modules.additionalModulePaths || []),
      ],
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      alias: {
        process$: 'process/browser',
      },
    },
    resolveLoader: {
      modules: [
        paths.nodeModulesDirectory,
        paths.ownNodeModules,
        'node_modules',
      ],
    },
    module: {
      strictExportPresence: true,
      rules: [
        {
          test: /\.[jt]sx?$/,
          include: [paths.applicationSource],
          use: [
            {
              loader: 'babel-loader',
              options: babelConfiguration,
            },
          ],
        },
        {
          test: /\.css$/i,
          use: createStyleLoaders({ isWeb, isDevelopment, sass: false }),
        },
        {
          test: /\.s[ac]ss$/i,
          use: createStyleLoaders({ isWeb, isDevelopment, sass: true }),
        },
        {
          test: assetPattern,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 10_000 } },
          generator: {
            emit: isWeb,
            filename: 'static/media/[name].[contenthash:8][ext]',
          },
        },
      ],
    },
  };

  const defineEnvironment = new webpack.DefinePlugin(dotenv.stringified);

  if (isNode) {
    config.externals = [
      nodeExternals({
        modulesDir: externalModuleDirectories[0],
        additionalModuleDirs: externalModuleDirectories.slice(1),
        allowlist: [
          isDevelopment && 'webpack/hot/poll?300',
          assetPattern,
          /\.(?:css|scss|sass)$/i,
        ].filter(Boolean),
      }),
    ];
    config.entry = [paths.serverEntry];
    config.output = {
      path: paths.appdeploy,
      publicPath,
      filename: 'server.js',
      library: { type: 'module' },
      clean: false,
    };
    config.experiments = { outputModule: true };
    config.plugins = [defineEnvironment];

    if (isProduction) {
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      );
    } else {
      config.entry.unshift('webpack/hot/poll?300');
      config.plugins.push(
        new webpack.HotModuleReplacementPlugin(),
        new StartServerPlugin({
          name: 'server.js',
          nodeArgs: [],
        }),
        new webpack.WatchIgnorePlugin({ paths: [paths.assets, paths.chunks] }),
      );
    }
  }

  if (isWeb) {
    config.entry = { client: paths.clientIndex };
    config.output = {
      path: paths.appdeployPublic,
      publicPath,
      pathinfo: isDevelopment,
      filename: isDevelopment
        ? 'static/js/bundle.js'
        : 'static/js/bundle.[contenthash:8].js',
      chunkFilename: isDevelopment
        ? 'static/js/[name].chunk.js'
        : 'static/js/[name].[contenthash:8].chunk.js',
      clean: false,
    };
    config.plugins = [
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
      }),
      defineEnvironment,
      new AssetsPlugin({ path: paths.appdeploy, filename: 'assets.json' }),
      new WebpackManifestPlugin({
        fileName: paths.chunks,
        writeToFileEmit: true,
        generate: (seed, files, entrypoints) =>
          createEntrypointManifest(publicPath, seed, files, entrypoints),
      }),
    ];
    config.infrastructureLogging = { level: 'error' };
    config.performance = isProduction
      ? { hints: 'warning', maxAssetSize: 512_000, maxEntrypointSize: 512_000 }
      : { hints: false };

    if (isDevelopment) {
      config.devServer = {
        allowedHosts: 'auto',
        client: { logging: 'none', overlay: true },
        compress: true,
        devMiddleware: { publicPath, stats: 'errors-warnings' },
        headers: { 'Access-Control-Allow-Origin': '*' },
        historyApiFallback: true,
        host: dotenv.raw.HOST,
        hot: true,
        port: devServerPort,
        static: { directory: paths.publicDirectory, watch: true },
      };
      config.plugins.push(new ReactRefreshWebpackPlugin({ overlay: false }));
      config.optimization = {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    } else {
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: 'static/css/bundle.[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),
      );
      config.optimization = {
        moduleIds: 'deterministic',
        minimize: true,
        minimizer: [
          new CssMinimizerPlugin(),
          new TerserPlugin({
            extractComments: false,
            terserOptions: { format: { comments: false } },
          }),
        ],
      };
    }

    if (useOnlyForClient && fs.existsSync(paths.appTemplate)) {
      config.plugins.push(
        new HtmlWebpackPlugin({
          inject: true,
          template: paths.appTemplate,
          minify: isProduction,
        }),
      );
    }
  }

  const installedPlugins = new Set();
  for (const plugin of Array.isArray(plugins) ? plugins : []) {
    const pluginName =
      typeof plugin === 'string' ? plugin : plugin.name || plugin;
    if (installedPlugins.has(pluginName)) continue;

    const implementation = await runPlugin(plugin);
    const pluginOptions =
      typeof plugin === 'object' && plugin !== null ? plugin : {};
    config =
      (await implementation.install(config, {
        ...pluginOptions,
        target,
        env: environment,
        dev: isDevelopment,
      })) || config;
    installedPlugins.add(pluginName);
  }

  return config;
}

createConfig.makeLoaderFinder = makeLoaderFinder;
createConfig.babelLoaderFinder = babelLoaderFinder;
createConfig.createEntrypointManifest = createEntrypointManifest;

export { createConfig, createEntrypointManifest, makeLoaderFinder };
export default createConfig;
