var _classCallCheck = require("@babel/runtime/helpers/classCallCheck").default;
var _createClass = require("@babel/runtime/helpers/createClass").default;

var WEBPACK_COMPILING = false;
var WEBPACK_DONE = false;

var chalk = require('chalk');

var clearConsole = require('react-dev-utils/clearConsole');

var formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');

var logger = require('./logger');

var WebpackErrorsPlugin = /*#__PURE__*/function () {
  "use strict";

  function WebpackErrorsPlugin(options) {
    _classCallCheck(this, WebpackErrorsPlugin);

    options = options || {};
    this.verbose = options.verbose;
    this.onSuccessMessage = options.onSuccessMessage;
    this.target = options.target === 'web' ? 'CLIENT' : 'SERVER';
  }

  _createClass(WebpackErrorsPlugin, [{
    key: "apply",
    value: function apply(compiler) {
      var _this = this;

      compiler.plugin('done', function (stats) {
        var rawMessages = stats.toJson({}, true);
        var messages = formatWebpackMessages(rawMessages);
        WEBPACK_COMPILING = false;

        if (!messages.errors.length && !messages.warnings.length) {
          if (!WEBPACK_DONE) {
            if (!_this.verbose) clearConsole();
            logger.done('Compiled successfully');
            WEBPACK_DONE = true;
            if (_this.onSuccessMessage) logger.log(_this.onSuccessMessage);
            logger.log('');
          }
        }

        if (messages.errors.length && !(rawMessages.errors && rawMessages.errors.length > 0 && (rawMessages.errors[0].includes('assets.json') || rawMessages.errors[0].includes('chunks.json') || rawMessages.errors[0].includes("Module not found: Can't resolve")))) messages.errors.forEach(function (e) {
          logger.error("Failed to compile ".concat(_this.target, " with ").concat(messages.errors.length, " errors"), e);
        });
        if (messages.warnings.length) logger.warn("Failed to compile with ".concat(messages.warnings.length, " warnings"));
        messages.warnings.forEach(function (w) {
          return logger.log(w);
        });
      });
      compiler.plugin('invalid', function (params) {
        WEBPACK_DONE = false;

        if (!WEBPACK_COMPILING) {
          if (!_this.verbose) clearConsole();
          logger.start('Compiling bundles...');
          WEBPACK_COMPILING = true;
        }
      });
    }
  }]);

  return WebpackErrorsPlugin;
}();

module.exports = WebpackErrorsPlugin;