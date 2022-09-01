"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Page = exports.Layout = exports.Head = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactHelmet = require("react-helmet");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Page extends _react.default.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return this.props.children;
  }

}

exports.Page = Page;

class Layout extends _react.default.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return this.props.children;
  }

}

exports.Layout = Layout;

class Head extends _react.default.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return this.props.children;
  }

}

exports.Head = Head;