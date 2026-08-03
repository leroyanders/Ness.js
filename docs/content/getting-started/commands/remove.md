# `ness remove`

Uninstalls a package from the current project. The `rm` alias is also available.

```bash
ness remove <package> [options]
ness rm <package> [options]
```

Official short names use the same `@nessframework/*` resolution as [`ness add`](./add.md).

```bash
ness remove env
# Removes @nessframework/env

ness rm @company/ness-plugin
ness remove analyzer --dry-run
```

`--dry-run` prints the npm uninstall operation without changing `package.json`, the lock file, or `node_modules`.
