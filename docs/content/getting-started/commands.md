---
sidebar_position: 2
---

# CLI commands

The `@ness/cli` package provides application creation, package management, code generation, development, builds, production, and diagnostics through the `ness` executable.

```bash
ness --help
ness <command> --help
ness --version
```

## Application lifecycle

| Command                             | Purpose                               |
| ----------------------------------- | ------------------------------------- |
| [`ness new`](./commands/new.md)     | Create an application from a template |
| [`ness dev`](./commands/dev.md)     | Start the development server          |
| [`ness build`](./commands/build.md) | Create optimized production bundles   |
| [`ness start`](./commands/start.md) | Serve an existing production build    |

## Code and routes

| Command                                   | Purpose                                 |
| ----------------------------------------- | --------------------------------------- |
| [`ness generate`](./commands/generate.md) | Generate routes and application modules |
| [`ness typegen`](./commands/typegen.md)   | Generate route types                    |
| [`ness routes`](./commands/routes.md)     | Print the discovered route tree         |
| [`ness reveal`](./commands/reveal.md)     | Materialize a framework entry module    |

## Package management

| Command                               | Purpose                                       |
| ------------------------------------- | --------------------------------------------- |
| [`ness add`](./commands/add.md)       | Install an official plugin or another package |
| [`ness remove`](./commands/remove.md) | Uninstall a package                           |
| [`ness update`](./commands/update.md) | Update installed `@ness/*` packages           |

## Project utilities

| Command                               | Purpose                                   |
| ------------------------------------- | ----------------------------------------- |
| [`ness clean`](./commands/clean.md)   | Remove build output and framework caches  |
| [`ness doctor`](./commands/doctor.md) | Validate the current Ness application     |
| [`ness info`](./commands/info.md)     | Print environment and package information |

All commands return a non-zero exit code when an operation fails, making them suitable for CI scripts.
