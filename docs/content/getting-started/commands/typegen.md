# `ness typegen`

Generates route types from the discovered route tree.

```bash
ness typegen
ness typegen --watch
```

Generated declarations provide types for route parameters, loader data, actions, and route-module arguments. A project with a `ness.config.mjs` gets them under `.ness/config`, the generated React Router root the CLI points the command at: `.ness/config/.react-router/types` for the route list and the server build, and `+types` directories mirroring `app/` for the route modules.

Use `--watch` during development when type generation is running separately from `ness dev`. Generated directories should not be edited manually.
