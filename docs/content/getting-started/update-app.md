---
sidebar_position: 4
---

# Update the application

Use the CLI to update the framework and every installed official plugin together.

## Preview the update

```bash
ness update --dry-run
```

The preview prints the npm operation without changing `package.json`, the lock file, or `node_modules`.

## Install stable releases

```bash
ness update
npm run check
```

Without package arguments, Ness discovers installed packages in the `@ness/*` scope and updates them to the `latest` npm tag.

Update selected packages when a smaller change is required:

```bash
ness update core cli
ness update tailwind analyzer
```

## Prerelease channel

```bash
ness update core cli --tag next
```

Review the generated lock-file diff and run the project test/build pipeline before deployment. See [`ness update`](./commands/update.md) for the full command reference.
