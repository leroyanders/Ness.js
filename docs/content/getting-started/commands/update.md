# `ness update`

Updates Ness framework packages and plugins in the current project.

```bash
ness update [packages...] [options]
```

With no package arguments, the command discovers installed `@nessframework/*` dependencies across `dependencies`, `devDependencies`, and `optionalDependencies`.

```bash
ness update --dry-run
ness update
ness update core cli
ness update core analyzer --tag next
```

| Option        | Description                                        | Default  |
| ------------- | -------------------------------------------------- | -------- |
| `--tag <tag>` | Select an npm distribution tag                     | `latest` |
| `--dry-run`   | Print the npm install operation without running it | disabled |

Short official names such as `core`, `cli`, and `tailwind` are expanded to the `@nessframework/*` scope. An explicit version already present in a package spec is preserved.

See [Update the application](../update-app.md) for the recommended upgrade workflow.
