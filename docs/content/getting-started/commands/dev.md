# `ness dev`

Starts the Vite development server with HMR and hot route-data revalidation.

```bash
ness dev [options]
```

| Option          | Description                                      |
| --------------- | ------------------------------------------------ |
| `--host <host>` | Bind to a hostname or network interface          |
| `--port <port>` | Preferred development port                       |
| `--open [path]` | Open the browser, optionally at a specific route |
| `--mode <mode>` | Select a Vite environment mode                   |
| `--force`       | Rebuild optimized dependencies                   |
| `--strict-port` | Fail instead of selecting another port           |

```bash
ness dev --host 0.0.0.0 --port 3000 --open
ness dev --mode staging --strict-port
```

Environment files are loaded using the selected mode. Route types and the route manifest are refreshed as application files change.

An unhandled server error is rendered by the Ness error overlay instead of a bare `Internal Server Error`: source-mapped stack frames, a code frame around the failing line, and editor links. The overlay is development-only — it is never applied to a build — and `ness({ overlay: false })` in `ness.config.mjs` turns it off.
