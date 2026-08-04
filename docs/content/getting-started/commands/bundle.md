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

The bundle contains the server build, the client assets, `public/`, your `ness.config.mjs`, and only the packages reachable from `dependencies`. It runs on a bare Node image with no install step.

The command prints how many packages were traced and how large the result is. If a declared dependency was not installed, it is named in a warning rather than silently dropped.

Unavailable in RSC mode, which does not emit the build manifest this reads.

## Cloudflare

```bash
ness build
ness bundle cloudflare
npx wrangler deploy
```

See [Deployment](../../documentation/deployment.md) for what the Workers runtime does not support.
