# `ness routes`

Prints the application route tree discovered from `app/routes`.

```bash
ness routes
ness routes --json
```

The default output is optimized for terminal inspection. `--json` produces machine-readable output for CI checks, documentation generation, and custom tooling.

Run this command when a route is not appearing where expected, or before a deployment to verify dynamic segments, layouts, and resource endpoints.
