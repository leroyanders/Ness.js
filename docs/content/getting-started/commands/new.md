# `ness new`

Creates a Ness application from an official, third-party, or local template.

```bash
ness new <project> [options]
ness n <project> [options]
```

## Options

| Option                      | Description                                     | Default   |
| --------------------------- | ----------------------------------------------- | --------- |
| `--template <name-or-path>` | Official alias, npm package, or local directory | `default` |
| `--rsc`                     | Enable experimental React Server Components     | disabled  |

## Examples

```bash
ness new store
ness n dashboard --template typescript
ness new service --template api
ness new admin --template dashboard
ness new prototype --template minimal
ness new internal-tool --template ../company-template
ness new rsc-app --template typescript --rsc
```

Project names may contain lowercase letters, numbers, dots, dashes, and underscores. The destination must be empty, apart from `.git` and `.DS_Store`.

Official aliases are `default`, `typescript` (`ts`), `minimal`, `api`, and `dashboard`. See [Official templates](../../templates/index.md) for their intended use.

See [Custom and local templates](../../templates/your-own-template.md) for filesystem paths, `template.json`, and package-style templates.
