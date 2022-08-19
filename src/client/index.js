import React from 'react';
import Router from '../router';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// tailwind
import 'ness-tailwind/styles/base.scss';

/* eslint-disable */
/*babel: disable */
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <BrowserRouter>
    <Router />
  </BrowserRouter>
);

// hot reload the components
if (module.hot) module.hot.accept(() => root.unmount());