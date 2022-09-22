import { renderRoutes } from 'nessapp/client/dom';

// pages
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Routes
const Routes = [
  {
    component: Home,
    path: '/',
    exact: true
  },
  {
    component: NotFound,
    path: '/*',
  },
];

// Initialize router
export function Router() {
  return renderRoutes(Routes)
}

export default Routes;

// hot reload the components
if (module.hot) module.hot.accept(() => root.unmount());