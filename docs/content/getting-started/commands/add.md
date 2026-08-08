# `ness add`

Installs a Ness plugin or another npm package in the current project.

```bash
ness add <package> [options]
```

Official aliases are expanded to the `@nessframework/*` scope:

```bash
ness add tailwind --dev
# npm install --save-dev @nessframework/tailwind

ness add security --dev --exact
ness add @company/ness-plugin
```

| Option          | Description                              |
| --------------- | ---------------------------------------- |
| `--dev`, `-D`   | Save the package to `devDependencies`    |
| `--exact`, `-E` | Save an exact version                    |
| `--dry-run`     | Print the npm command without running it |

Recognized official aliases include `nest`, `tailwind`, `security`, `env`, `compression`, `analyzer`, and `components`. Scoped and third-party package names pass through unchanged.
