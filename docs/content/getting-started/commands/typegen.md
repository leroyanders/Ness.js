# `ness typegen`

Generates route types from the discovered route tree.

```bash
ness typegen
ness typegen --watch
```

Generated declarations are stored under `.react-router/types` and provide types for route parameters, loader data, actions, and route-module arguments.

Use `--watch` during development when type generation is running separately from `ness dev`. Generated directories should not be edited manually.
