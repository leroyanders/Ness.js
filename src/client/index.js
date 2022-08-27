import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Router
import Router from '../router';

// tailwind
import 'ness-tailwind/styles/base.scss';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <BrowserRouter>
    <Router />
  </BrowserRouter>
);

// hot reload the components
if (module.hot) module.hot.accept(() => root.unmount());