var _toConsumableArray = require("@babel/runtime/helpers/toConsumableArray").default;
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck").default;
var _createClass = require("@babel/runtime/helpers/createClass").default;
var path = require('path');

var WebpackConfig = /*#__PURE__*/function () {
  "use strict";

  function WebpackConfig(cwd) {
    _classCallCheck(this, WebpackConfig);

    this._cwd = cwd;
  }

  _createClass(WebpackConfig, [{
    key: "getLoaders",
    value: function getLoaders(config) {
      config.stats = 'none';
      return this.getRules(config).map(function (_ref) {
        var rule = _ref.rule,
            index = _ref.index;
        return {
          rule: rule,
          ruleIndex: index,
          loaders: rule.loaders || rule.use || rule.loader
        };
      });
    }
  }, {
    key: "getRules",
    value: function getRules(config) {
      config.stats = 'none';
      return [].concat(_toConsumableArray(config.module.loaders || []), _toConsumableArray(config.module.rules || [])).map(function (rule, index) {
        return {
          index: index,
          rule: rule
        };
      });
    }
  }, {
    key: "getPlugins",
    value: function getPlugins(config) {
      config.stats = 'none';
      return (config.plugins || []).map(function (plugin, index) {
        return {
          index: index,
          plugin: plugin
        };
      });
    }
  }, {
    key: "getRulesByMatchingFile",
    value: function getRulesByMatchingFile(config, file) {
      config.stats = 'none';
      var filePath = path.resolve(this._cwd, file);
      return this.getRules(config).filter(function (w) {
        return w.rule.test && w.rule.test.exec(filePath);
      });
    }
  }, {
    key: "getLoadersByName",
    value: function getLoadersByName(config, name) {
      config.stats = 'none';
      return this.getLoaders(config).map(function (_ref2) {
        var rule = _ref2.rule,
            ruleIndex = _ref2.ruleIndex,
            loaders = _ref2.loaders;
        return Array.isArray(loaders) ? loaders.map(function (loader, loaderIndex) {
          return {
            rule: rule,
            ruleIndex: ruleIndex,
            loader: loader,
            loaderIndex: loaderIndex
          };
        }) : [{
          rule: rule,
          ruleIndex: ruleIndex,
          loader: loaders,
          loaderIndex: -1
        }];
      }).reduce(function (arr, loaders) {
        return arr.concat(loaders);
      }, []).filter(function (_ref3) {
        var loader = _ref3.loader;
        return loader === name || loader && loader.loader === name;
      });
    }
  }, {
    key: "getPluginsByName",
    value: function getPluginsByName(config, name) {
      config.stats = 'none';
      return this.getPlugins(config).filter(function (w) {
        return w.plugin && w.plugin.constructor && w.plugin.constructor.name === name;
      });
    }
  }, {
    key: "getPluginsByType",
    value: function getPluginsByType(config, type) {
      config.stats = 'none';
      return this.getPlugins(config).filter(function (w) {
        return w.plugin instanceof type;
      });
    }
  }, {
    key: "getResolveExtensions",
    value: function getResolveExtensions(config) {
      config.stats = 'none';
      return config.resolve.extensions;
    }
  }, {
    key: "addResolveExtensions",
    value: function addResolveExtensions(config, ext) {
      config.stats = 'none';
      return config.resolve.extensions.concat(ext);
    }
  }, {
    key: "makeLoaderFinder",
    value: function makeLoaderFinder(loaderName) {
      return function findLoader(rule) {
        // i.e.: /eslint-loader/
        var loaderRegex = new RegExp("[/\\\\]".concat(loaderName, "[/\\\\]")); // Checks if there's a loader string in rule.loader matching loaderRegex.

        var inLoaderString = typeof rule.loader === 'string' && rule.loader.match(loaderRegex); // Checks if there is an object inside rule.use with loader matching loaderRegex, OR

        var inUseArray = Array.isArray(rule.use) && rule.use.find(function (loader) {
          return typeof loader.loader === 'string' && loader.loader.match(loaderRegex);
        });
        return inUseArray || inLoaderString;
      };
    }
  }]);

  return WebpackConfig;
}();

module.exports = WebpackConfig;