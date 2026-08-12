# `ness build`

Creates optimized client and server production bundles.

```bash
ness build [options]
```

| Option               | Description                             |
| -------------------- | --------------------------------------- |
| `--config <file>`    | Use a custom Vite configuration         |
| `--mode <mode>`      | Select a Vite environment mode          |
| `--sourcemap-client` | Emit source maps for the browser bundle |
| `--sourcemap-server` | Emit source maps for the server bundle  |
| `--profile`          | Run the build with the Node inspector   |

```bash
ness build
ness build --mode staging --sourcemap-server
```

The default output is written to `build/client` and `build/server` (RSC builds also add `build/server/__ssr_build`). The build also writes `build/ness-manifest.json`, which records the built routes, the cache profiles, and the deployment settings from `ness.config.mjs` — in RSC mode this comes from Ness's own route tree rather than React Router's build manifest, since RSC Framework Mode does not support a `buildEnd` hook. Use [`ness start`](./start.md) to serve the completed build.
