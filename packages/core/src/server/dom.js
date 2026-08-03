import React from 'react';
import { renderToString } from 'react-dom/server';
import { Route, Routes, StaticRouter, matchRoutes } from 'react-router';

const HelmetProvider = ({ children }) => children;

function unwrapData(value) {
  return value && Object.prototype.hasOwnProperty.call(value, 'data')
    ? value.data
    : value;
}

async function loadRouteData(routes, location, store) {
  const matches = matchRoutes(routes, location) || [];
  const routeEntries = await Promise.all(
    matches.map(async ({ route }) => {
      const load = route.component && route.component.useServerSideFetching;
      if (typeof load !== 'function') return [];

      const pending = await load({ ...store, path: location });
      return Promise.all(
        Object.entries(pending || {}).map(async ([key, value]) => [
          key,
          unwrapData(await value),
        ]),
      );
    }),
  );

  Object.assign(store, Object.fromEntries(routeEntries.flat()));
}

function serializeForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

async function useServerRendering({
  request,
  response,
  routes,
  assets,
  store = {},
  production = false,
  external = {},
}) {
  await loadRouteData(routes, request.path, store);

  const helmetContext = {};
  const useServerSideProps = () => store;
  const routeElements = routes.map(route =>
    React.createElement(Route, {
      key: route.id || route.path,
      path: route.path,
      element: React.createElement(route.component, {
        ...store,
        useServerSideProps,
      }),
    }),
  );
  const application = React.createElement(
    HelmetProvider,
    { context: helmetContext },
    React.createElement(
      StaticRouter,
      { location: request.originalUrl || request.path },
      React.createElement(Routes, null, routeElements),
    ),
  );
  const body = renderToString(application);
  const helmet = helmetContext.helmet;
  const metadata = helmet
    ? [helmet.title, helmet.meta, helmet.link]
        .map(value => value.toString())
        .join('')
    : '';
  const clientAssets =
    assets && assets.client ? assets.client : { css: [], js: [] };

  return response.status(200).render('index', {
    metadata,
    production,
    clientStyles: (clientAssets.css || []).filter(
      chunk => !chunk.includes('.map'),
    ),
    bundledScript: (clientAssets.js || []).filter(
      chunk => !chunk.includes('.map'),
    ),
    body,
    external,
    __context__: `window.__context__ = ${serializeForScript(store)}`,
  });
}

export { loadRouteData, serializeForScript, useServerRendering };
