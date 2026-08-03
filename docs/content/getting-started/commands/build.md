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

The default output is written to `build/client` and `build/server`. Use [`ness start`](./start.md) to serve the completed build.
