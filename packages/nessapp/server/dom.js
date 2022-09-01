"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.useServerRendering = void 0;

var _react = _interopRequireDefault(require("react"));
var _server = require("react-router-dom/server");
var _server2 = require("react-dom/server");
var _reactHelmet = require("react-helmet");
var _reactRouterDom = require("react-router-dom");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function matchRoutes(routesArr, location) { return routesArr.filter(route => route.path.match(location)).filter(route => (route === null || route === void 0 ? void 0 : route.exact) && route.path === location)};

const useServerRendering = async ({request, response, routes, assets, server, store = {}, production = false, external = {}}) => {
  let storeKeys = [];
  let storePromises = [];

  const actions = matchRoutes(routes, request.path).map(route => {
    var _route$component;

    if ((_route$component = route.component) !== null && _route$component !== void 0 && _route$component.useServerSideFetching) {
      const fetch = route.component.useServerSideFetching({ ...store,
        path: request.path
      });
      Object.keys(fetch).forEach(key => {
        storeKeys.push(key) && storePromises.push(fetch[key]);
      });
      route.component.useServerSideFetching({ ...store,
        path: request.path
      });
    }
  }).map(async actions => await Promise.all((actions || []).map(p => p && new Promise(resolve => p.then(resolve).catch(resolve)))));
  storePromises = await Promise.all(storePromises.map(p => p && new Promise(resolve => p.then(resolve).catch(resolve))));
  await Promise.all(actions).then(async () => {
    storePromises.map((response, id) => {
      store[storeKeys[id]] = response.data;
    });
    const context = {};

    const useServerSideProps = () => {
      return store;
    };

    const serverRouter = (0, _server2.renderToString)( /*#__PURE__*/_react.default.createElement(_server.StaticRouter, {
      location: request.path,
      context: context
    }, /*#__PURE__*/_react.default.createElement(_reactRouterDom.Routes, null, routes.map(route => {
      return /*#__PURE__*/_react.default.createElement(_reactRouterDom.Route, {
        key: route.path,
        path: route.path,
        element: /*#__PURE__*/_react.default.createElement(route.component, _extends({}, store, {
          useServerSideProps: useServerSideProps
        }))
      });
    }))));

    const metadata = _reactHelmet.Helmet.renderStatic();

    const meta = metadata.meta.toComponent();
    const title = metadata.title.toComponent();
    const manifest = (0, _server2.renderToString)(meta) + (0, _server2.renderToString)(title);
    if (context.url) response.redirect(context.url);else response.status(200).render('index', {
      // metadata
      metadata: manifest,
      production: production,
      // body of the response
      clientStyles: assets.client.css.filter(chunk => !chunk.includes('.map')),
      bundledScript: assets.client.js.filter(chunk => !chunk.includes('.map')),
      body: serverRouter,
      external: external,
      // content    
      __context__: `window.__context__ = ${JSON.stringify(store)}`
    });
  });
}; // exports.useServerRendering = useServerRendering;


exports.useServerRendering = useServerRendering;