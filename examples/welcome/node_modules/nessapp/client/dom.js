"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = render;
exports.renderRoutes = renderRoutes;

var _reactRouterDom = require("react-router-dom");
var _react = _interopRequireDefault(require("react"));
var _client = _interopRequireDefault(require("react-dom/client"));
var _reactRouterDom = require("react-router-dom");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function render(dom, container) {
  const root = _client.default.createRoot(container);
  root.render( /*#__PURE__*/_react.default.createElement(_reactRouterDom.BrowserRouter, null, dom));
}

function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function renderRoutes(arr) {
  const matchRoutes = (routesArr, location) => routesArr.filter(route => route.path.match(location)).filter(route => (route === null || route === void 0 ? void 0 : route.exact) && route.path === location);

  const useServerSideProps = () => {
    return window.__context__;
  };

  return /*#__PURE__*/_react.default.createElement(_reactRouterDom.Routes, null, arr.map(route => {
    return /*#__PURE__*/_react.default.createElement(_reactRouterDom.Route, {
      key: route.path,
      path: route.path,
      element: /*#__PURE__*/_react.default.createElement(route.component, _extends({}, window.__context__, {
        useServerSideProps: useServerSideProps
      }))
    });
  }));
}