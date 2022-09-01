#! /usr/bin/env node

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck").default;
var _createClass = require("@babel/runtime/helpers/createClass").default;
var _get = require("@babel/runtime/helpers/get").default;
var _getPrototypeOf = require("@babel/runtime/helpers/getPrototypeOf").default;
var _inherits = require("@babel/runtime/helpers/inherits").default;
var _createSuper = require("@babel/runtime/helpers/createSuper").default;
var webpackDevServer = require('webpack-dev-server');
var DevelopmentServer = /*#__PURE__*/function (_webpackDevServer) {
  "use strict";

  _inherits(DevelopmentServer, _webpackDevServer);

  var _super = _createSuper(DevelopmentServer);

  function DevelopmentServer(compiler) {
    var _this;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _log = arguments.length > 2 ? arguments[2] : undefined;

    _classCallCheck(this, DevelopmentServer);

    var verbose = options.verbose || false;
    delete options['verbose'];
    _this = _super.call(this, compiler, options, _log);
    _this.verbose = verbose;
    return _this;
  }

  _createClass(DevelopmentServer, [{
    key: "dispatchStatus",
    value: function dispatchStatus() {
      if (this.verbose) _get(_getPrototypeOf(DevelopmentServer.prototype), "dispatchStatus", this).call(this);
    }
  }]);

  return DevelopmentServer;
}(webpackDevServer);

module.exports = DevelopmentServer;