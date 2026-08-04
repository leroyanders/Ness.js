# ness migrate

Migrates an application from another framework.

```bash
ness migrate next [directory]
```

Only `next` is supported, and only the App Router.

## Options

| Option      | Description                                            |
| ----------- | ------------------------------------------------------ |
| `--dry-run` | Print the plan and the report without changing a file. |
| `--force`   | Run even when the git working tree is dirty or absent. |

A clean git working tree is required by default so the migration can be reviewed as a diff.

## Output

Files are moved into the Ness layout, imports with a direct equivalent are rewritten, and `MIGRATION.md` records:

- every file moved
- every import rewritten
- everything that needs a human, with the reason

See [Migrating from Next.js](../../documentation/migrating-from-next.md) for the full mapping and for what is deliberately left alone.
