"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.useContainer = useContainer;
exports.useRefresh = useRefresh;
exports.useDocument = useDocument;
exports.useRoot = useRoot;
exports.render = render;
exports.renderRoutes = renderRoutes;

var _reactRouterDom = require("react-router-dom");
var _react = _interopRequireDefault(require("react"));
var _client = _interopRequireDefault(require("react-dom/client"));
var _reactRouterDom = require("react-router-dom");

const rootElement = (dom) => {
  if (typeof document !== 'undefined') {
    return _client.default.createRoot(dom);
  } else {
    return {
      render: () => {}
    };
  }
}

function useRoot(doc) {
  return window.component = doc;
}

function useContainer(element) {
  return typeof window.rootContainer === "undefined"? window.rootContainer = rootElement(element) : window.rootContainer;
}

function useDocument(element) {
  return window.component = element;
}

function useRefresh(module) {
  if (module.hot) {
    module.hot.accept(() => {
      useContainer().render(/*#__PURE__*/_react.default.createElement(_reactRouterDom.BrowserRouter, null, window.component))
    })
  }
}

/*
  Render client side components using render function.
  Options: {
    component: "Pass the component(F.e. <Router/>)",
    module: "Pass the module, for hot reload"
  }
*/
function render(options) {
  const { root, document } = options;

  // render the root element
  return root.render( /*#__PURE__*/_react.default.createElement(_reactRouterDom.BrowserRouter, null, document));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
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