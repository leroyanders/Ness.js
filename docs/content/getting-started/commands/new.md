# `ness new`

Creates a Ness application from an official, third-party, or local template.

```bash
ness new <project> [options]
ness n <project> [options]
```

## Options

| Option                      | Description                                     | Default      |
| --------------------------- | ----------------------------------------------- | ------------ |
| `--template <name-or-path>` | Official alias, npm package, or local directory | `typescript` |
| `--rsc`                     | Enable experimental React Server Components     | disabled     |

## Examples

```bash
ness new store
ness n prototype --template javascript
ness new service --template api
ness new admin --template dashboard
ness new tiny-app --template minimal
ness new internal-tool --template ../company-template
ness new rsc-app --rsc
```

Project names may contain lowercase letters, numbers, dots, dashes, and underscores. The destination must be empty, apart from `.git` and `.DS_Store`.

Official aliases are `typescript` (`ts`), `javascript` (`js`, and `default`), `minimal`, `api`, and `dashboard`. See [Official templates](../../templates/index.md) for their intended use.

`default` is kept as a third name for the JavaScript starter. It was the alias `--template` fell back to before TypeScript became the default, so scripts that spell it out keep scaffolding what they always did.

See [Custom and local templates](../../templates/your-own-template.md) for filesystem paths, `template.json`, and package-style templates.
