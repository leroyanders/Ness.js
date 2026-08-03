# `ness doctor`

Diagnoses the current Ness application and exits unsuccessfully when a required check fails.

```bash
ness doctor
```

The command verifies:

- Node.js satisfies the minimum version
- `package.json` exists
- a compatible `@ness/core` is installed
- a compatible `@ness/nest` is installed
- `ness.config.mjs` (or a legacy Vite configuration) is present
- `app/root` exists
- the application route directory exists
- the Nest root module exists at `app/server/app.module`

Use it in bug reports and CI diagnostics. For operating-system and installed-tool versions, use [`ness info`](./info.md).
