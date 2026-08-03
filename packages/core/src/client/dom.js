import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

const HelmetProvider = ({ children }) => children;

let currentDocument;
let currentRoot;

function applicationTree(document) {
  return React.createElement(
    HelmetProvider,
    null,
    React.createElement(BrowserRouter, null, document),
  );
}

function createRootController(container) {
  if (!container) throw new TypeError('A DOM container is required.');
  let root;

  return {
    render(element) {
      if (!root && container.hasChildNodes()) {
        root = hydrateRoot(container, element);
        return root;
      }
      if (!root) root = createRoot(container);
      root.render(element);
      return root;
    },
    unmount() {
      if (root) root.unmount();
    },
  };
}

function useRoot(document) {
  currentDocument = document;
  if (typeof window !== 'undefined') window.component = document;
  return document;
}

function useDocument(document) {
  return useRoot(document);
}

function useContainer(container) {
  if (!currentRoot) currentRoot = createRootController(container);
  return currentRoot;
}

function useRefresh(hotModule) {
  if (!hotModule || !hotModule.hot) return;
  hotModule.hot.accept(() => {
    if (currentRoot && currentDocument) {
      currentRoot.render(applicationTree(currentDocument));
    }
  });
}

function render(options, legacyContainer) {
  const normalized = React.isValidElement(options)
    ? { document: options, container: legacyContainer }
    : options || {};
  const document = useRoot(normalized.document);
  const root = normalized.root || useContainer(normalized.container);

  useRefresh(normalized.module);
  root.render(applicationTree(document));
  return root;
}

function renderRoutes(routes) {
  const serverContext =
    typeof window === 'undefined' ? {} : window.__context__ || {};
  const useServerSideProps = () => serverContext;

  return React.createElement(
    Routes,
    null,
    routes.map(route =>
      React.createElement(Route, {
        key: route.id || route.path,
        path: route.path,
        element: React.createElement(route.component, {
          ...serverContext,
          useServerSideProps,
        }),
      }),
    ),
  );
}

export { render, renderRoutes, useContainer, useDocument, useRefresh, useRoot };
export default render;
