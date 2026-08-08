# Errors in development

`ness dev` renders unhandled server errors as a page with source-mapped stack frames, a code frame around the failing line, and a link that opens the file in your editor — instead of a bare "Internal Server Error".

It applies to errors thrown from loaders, actions, middleware, and server rendering. The stack is mapped back through Vite's transform, so the locations point at the file you wrote, not the compiled output.

Frames inside `node_modules` are dimmed and not linked. Only files inside the project root are read for the code frame, so a frame pointing outside it cannot be used to read arbitrary files through the dev server.

The overlay never runs in production; the plugin is not applied to builds.

## Errors the application handles

When a route has an `error.tsx` boundary, React Router renders it and the request succeeds — which is correct behaviour, but hides the cause while you are working. Those errors are also pushed into Vite's own overlay, so the boundary renders and the stack is still visible.

## Configuration

```js title="ness.config.mjs"
import { ness } from '@nessframework/router/vite';

export default defineNessConfig({
  vite: {
    plugins: [
      ness({
        overlay: {
          onError(error, request) {
            reportToSentry(error, { url: request.url });
          },
        },
      }),
    ],
  },
});
```

Pass `overlay: false` to disable it and fall back to Vite's default response.

## Production

The overlay is a development tool. In production, use route boundaries — `error.tsx`, `not-found.tsx`, `forbidden.tsx`, `unauthorized.tsx` — and the `onError` instrumentation hook to report to your error tracker.

## Reporting errors a boundary caught

`onError` fires for errors the request handler catches **and** for errors a route boundary handled.

That second case is the one worth naming. A loader or an action that throws on a route with an `error.tsx` is caught by the router: the boundary renders and the response is ordinary. The visitor sees the fallback and, without this, the error tracker sees nothing — the failure that matters most is the one that looks handled.

```js title="instrumentation.mjs"
import * as Sentry from '@sentry/node';

export default {
  onError({ error, request, source }) {
    Sentry.captureException(error, {
      tags: { source },
      extra: { url: request?.url },
    });
  },
};
```

`source` is `'route'` when a boundary handled it and absent when the request handler caught it, so the two can be told apart.

A request the client abandoned is not reported. The error there is that the connection went away, not that the application failed.

If nothing is listening for `onError`, the error still reaches the console, as it did before any instrumentation was registered. If something is listening, it is not logged twice.

An application that exports its own `handleError` from `entry.server` keeps it — it runs alongside the hook rather than instead of it.
