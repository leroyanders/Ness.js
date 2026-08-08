# `ness start`

Serves an existing production build using the Ness Node runtime.

```bash
ness start [options]
```

| Option           | Description        | Default                 |
| ---------------- | ------------------ | ----------------------- |
| `--host <host>`  | Server hostname    | `0.0.0.0`               |
| `--port <port>`  | Server port        | `3000`                  |
| `--build <file>` | Server build entry | `build/server/index.js` |

```bash
ness build
ness start --host 127.0.0.1 --port 8080
```

When flags are omitted, `HOST` and `PORT` environment variables override the listed defaults, which makes the command work with managed hosting platforms without wrapper scripts.

The production runtime serves immutable assets, public files, SSR and RSC responses, routing rules, middleware, page caching, image optimization, and the Ness health endpoint at `/_ness/health`. The command fails early when the selected server build does not exist.

Responses are compressed per request after negotiating `Accept-Encoding` — Brotli first, then gzip — and a precompressed `.br` or `.gz` twin sitting next to an asset is served instead of being compressed again, with the original `Content-Type` kept and `Vary: Accept-Encoding` set. `server.compression: false` in `ness.config.mjs` turns both off.

With `server.trustProxy` enabled, `X-Forwarded-Proto` and `X-Forwarded-Host` are applied to the request URL before the request is handled, so redirects and generated links use the address the visitor reached. It is off by default, because those headers come from the client unless a proxy overwrites them.

On `SIGINT` or `SIGTERM` the server drains: `/_ness/health` starts answering `503` while in-flight requests finish, and idle connections are closed as they free up. The grace period is `server.shutdownTimeout` — 10 seconds by default, and `NESS_SHUTDOWN_TIMEOUT` overrides it — after which the remaining connections are cut and the process exits `1`.

The `server` section comes from `ness.config.mjs` when the project has one, and from `ness.server.config.mjs` otherwise — the runtime-only file the Worker and Lambda targets read. Whichever file is found, the same resolution runs on every target, so `ness start` and a deployed build honour the same settings.
