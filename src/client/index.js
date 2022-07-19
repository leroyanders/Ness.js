import React from 'react';
import Router from './router';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// root element for rendering div#root
// eslint-disable-next-line
const root = ReactDOM.createRoot(document.getElementById("root"));

// render
root.render(
  <BrowserRouter>
    <Router />
  </BrowserRouter>
);

// hot reload the components
if (module.hot) module.hot.accept();