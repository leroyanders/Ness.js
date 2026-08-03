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

The production runtime serves immutable assets, public files, SSR and RSC responses, routing rules, middleware, page caching, image optimization, and the Ness health endpoint. The command fails early when the selected server build does not exist.
