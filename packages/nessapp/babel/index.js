var _typeof = require("@babel/runtime/helpers/typeof").default;

var path = require('path');

var env = process.env.NODE_ENV;
var isProduction = env === 'production';
var isDevelopment = env === 'development';
var isTest = env === 'test';

var supportsStaticESM = function supportsStaticESM(caller) {
  return !!caller && caller.supportsStaticESM;
};

module.exports = function (api, options) {
  options = options || {};
  var supportsESM = api.caller(supportsStaticESM);
  var isServer = api.caller(function (caller) {
    return !!caller && caller.isServer;
  });
  var isModern = api.caller(function (caller) {
    return !!caller && caller.isModern;
  });
  var isLaxModern = isModern || (options['preset-env'] || {}).targets && options['preset-env'].targets.esmodules === true;
  var presetEnvConfig = Object.assign({
    modules: 'auto',
    exclude: ['transform-typeof-symbol']
  }, options['preset-env'] || {});

  if ((isServer || isTest) && (!presetEnvConfig.targets || !(_typeof(presetEnvConfig.targets) === 'object' && 'node' in presetEnvConfig.targets))) {
    presetEnvConfig.targets = {
      node: 'current'
    };
  }

  var customModernPreset = isLaxModern && options['experimental-modern-preset'];
  return {
    sourceType: 'unambiguous',
    presets: [customModernPreset || [require('@babel/preset-env').default, presetEnvConfig], [require('@babel/preset-react'), Object.assign({
      development: isDevelopment || isTest
    }, (options['preset-react'] || {}).runtime !== 'automatic' ? {
      pragma: '__jsx'
    } : {}, options['preset-react'] || {})], options['preset-typescript'] !== false && [require('@babel/preset-typescript'), Object.assign({
      allowNamespaces: true,
      allExtensions: true,
      isTSX: true
    }, options['preset-typescript'] || {})]].filter(Boolean),
    plugins: [(options['preset-react'] || {}).runtime !== 'automatic' && [require('./plugins/useJSX'), {
      module: 'react',
      importAs: 'React',
      pragma: '__jsx',
      property: 'createElement'
    }], [require('./plugins/useHooks'), {
      lib: true
    }], require('@babel/plugin-syntax-dynamic-import'), options['class-properties'] !== false && [require('@babel/plugin-proposal-class-properties'), options['class-properties'] || {}], [require('@babel/plugin-proposal-object-rest-spread'), {
      useBuiltIns: true
    }], !isServer && [require('@babel/plugin-transform-runtime'), Object.assign({
      corejs: false,
      helpers: true,
      regenerator: true,
      useESModules: supportsESM && presetEnvConfig.modules !== 'commonjs',
      absoluteRuntime: path.dirname(require.resolve('@babel/runtime/package.json')),
      version: require('@babel/runtime/package.json').version
    }, options['transform-runtime'] || {})], isProduction && [require('babel-plugin-transform-react-remove-prop-types'), {
      removeImport: true
    }], require('@babel/plugin-proposal-optional-chaining'), require('@babel/plugin-proposal-nullish-coalescing-operator'), isServer && require('@babel/plugin-syntax-bigint'), [require('@babel/plugin-proposal-numeric-separator').default, false]].filter(Boolean)
  };
};