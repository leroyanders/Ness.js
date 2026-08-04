import { Suspense, createElement } from 'react';
import { Await, isRouteErrorResponse, useAsyncError } from 'react-router';

function describe(error) {
  if (isRouteErrorResponse(error)) return error.statusText || `${error.status}`;
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

/** Only valid inside an `errorElement`, the one place the hook works. */
function StreamedError({ render }) {
  const error = useAsyncError();
  return render(error, describe(error));
}

/**
 * Renders a value a loader returned without awaiting.
 *
 * A loader that returns a promise lets the document stream: the shell is sent
 * immediately and this subtree is filled in when the promise settles. That
 * normally means wiring `<Suspense>`, `<Await>`, and an error element together,
 * and getting one of the three wrong turns a slow query into a blank page or an
 * unhandled rejection.
 *
 *   export async function loader() {
 *     return { user: await getUser(), reviews: getReviews() };
 *   }
 *
 *   <Streamed value={reviews} fallback={<p>Loading reviews…</p>}>
 *     {list => <Reviews items={list} />}
 *   </Streamed>
 *
 * Passing `error` keeps a rejection local: one slow panel failing renders that
 * panel's error instead of replacing the whole page through the route boundary.
 */
function Streamed({ value, children, fallback = null, error }) {
  const errorElement =
    error === undefined
      ? undefined
      : typeof error === 'function'
        ? createElement(StreamedError, { render: error })
        : error;

  return createElement(
    Suspense,
    { fallback },
    createElement(Await, { resolve: value, errorElement }, children),
  );
}

export { Streamed };
