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
