# ness bundle

Packages an existing build for deployment. Run `ness build` first.

```bash
ness bundle [target]
```

| Target           | Output                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `node` (default) | `build/standalone/` — a self-contained directory with a traced `node_modules` and a launcher |
| `cloudflare`     | `build/worker/index.js` and a `wrangler.json`                                                |

## Options

| Option                    | Description                                                             |
| ------------------------- | ----------------------------------------------------------------------- |
| `--output <dir>`          | Output directory for the `node` target. Defaults to `build/standalone`. |
| `--build-directory <dir>` | Build directory to read. Defaults to `build`.                           |
| `--name <name>`           | Worker name for the `cloudflare` target. Defaults to the package name.  |

## Node

```bash
ness build
ness bundle node
node build/standalone/server.mjs
```

The bundle contains the server build, the client assets, `public/`, your `ness.config.mjs`, an `instrumentation.mjs` if the project has one, and only the packages reachable from `dependencies`. It runs on a bare Node image with no install step.

The command prints how many packages were traced and how large the result is. If a declared dependency was not installed, it is named in a warning rather than silently dropped.

The output directory is emptied before it is written, so `--output` is refused when it is the project directory or contains it.

`@nessframework/core/rsc` lists standalone bundling as unsupported in RSC mode, because RSC builds do not emit `build/ness-manifest.json`. The command itself has no such check: it copies the build output and traces `package.json`, and reads no manifest.

## Cloudflare

```bash
ness build
ness bundle cloudflare
npx wrangler deploy
```

A Worker cannot read a file at runtime, so the runtime configuration has to be a static import. When the project has a `ness.server.config.mjs`, the generated entry imports it and the Worker applies the same `server` and `instrumentation` sections `ness start` does. `ness.config.mjs` is not bundled — it imports Vite plugins at module scope — and the command says so, and names the sections to move, when it finds one and no runtime config beside it.

See [Deployment](../../documentation/deployment.md) for what the Workers runtime does not support.
