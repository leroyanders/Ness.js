import { Suspense, createElement } from 'react';
import type { ReactNode } from 'react';
import { Await, isRouteErrorResponse, useAsyncError } from 'react-router';

export interface StreamedProps<T> {
  /** A promise a loader returned without awaiting. */
  value: Promise<T> | T;
  children: (value: T) => ReactNode;
  fallback?: ReactNode;
  /** Keeps a rejection local instead of reaching the route boundary. */
  error?: ReactNode | ((error: unknown, message: string) => ReactNode);
}

function describe(error: unknown): string {
  if (isRouteErrorResponse(error)) return error.statusText || `${error.status}`;
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

/** Only valid inside an `errorElement`, the one place the hook works. */
function StreamedError({
  render,
}: {
  render: (error: unknown, message: string) => ReactNode;
}): ReactNode {
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
function Streamed<T>({
  value,
  children,
  fallback = null,
  error,
}: StreamedProps<T>): ReactNode {
  const errorElement =
    error === undefined
      ? undefined
      : typeof error === 'function'
        ? createElement(StreamedError, { render: error })
        : error;

  return createElement(
    Suspense,
    { fallback },
    // `children` travels in the props object: Await declares it required, and
    // createElement's third argument does not satisfy that overload.
    createElement(Await<Promise<T> | T>, {
      resolve: value,
      errorElement,
      // Await calls this with the resolved value, which is T. That `Awaited<T>`
      // and `T` coincide here is not something TS can prove for a generic T.
      children: children as (value: Awaited<Promise<T> | T>) => ReactNode,
    }),
  );
}

export { Streamed };
