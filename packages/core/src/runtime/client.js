import React from 'react';
import * as router from 'react-router';
import { reportWebVitals } from '@nessframework/instrumentation';

function useNavigationProgress() {
  const navigation = router.useNavigation();
  return {
    location: navigation.location,
    pending: navigation.state !== 'idle',
    state: navigation.state,
  };
}

function useOptimisticAction(initialValue, reducer) {
  const [optimistic, addOptimistic] = React.useOptimistic(
    initialValue,
    reducer,
  );
  const navigation = router.useNavigation();
  return [optimistic, addOptimistic, navigation.state !== 'idle'];
}

function prefetch(href, { signal, headers } = {}) {
  const url = new URL('/__manifest', window.location.origin);
  url.searchParams.set('p', href);
  return fetch(url, { headers, signal, credentials: 'same-origin' });
}

function useRouter() {
  const navigate = router.useNavigate();
  const revalidator = router.useRevalidator();
  return React.useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      prefetch,
      push: (href, options) => navigate(href, options),
      refresh: () => revalidator.revalidate(),
      replace: (href, options) => navigate(href, { ...options, replace: true }),
    }),
    [navigate, revalidator],
  );
}

function useSelectedLayoutSegments() {
  return router.useLocation().pathname.split('/').filter(Boolean);
}

function useSelectedLayoutSegment(index = 0) {
  return useSelectedLayoutSegments()[index] || null;
}

function useLinkStatus(href) {
  const navigation = router.useNavigation();
  return {
    pending:
      navigation.location?.pathname === href && navigation.state !== 'idle',
  };
}

function useReportWebVitals(callback) {
  React.useEffect(() => reportWebVitals(callback), [callback]);
}

const usePathname = () => router.useLocation().pathname;
const { Form, Link, NavLink, PrefetchPageLinks, useParams, useSearchParams } =
  router;

export {
  Form,
  Link,
  NavLink,
  PrefetchPageLinks,
  prefetch,
  reportWebVitals,
  useLinkStatus,
  useNavigationProgress,
  useOptimisticAction,
  useParams,
  usePathname,
  useReportWebVitals,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
};
