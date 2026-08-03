# `ness clean`

Removes generated build output and framework caches.

```bash
ness clean [options]
```

By default, the command removes these directories when present:

- `.ness`
- `.react-router`
- `build`
- `dist`

```bash
ness clean --dry-run
ness clean
ness clean --coverage
```

| Option       | Description                                      |
| ------------ | ------------------------------------------------ |
| `--coverage` | Also remove the `coverage` directory             |
| `--dry-run`  | Print matching directories without removing them |

The target list is fixed: source files, public assets, lock files, and `node_modules` are never removed.
