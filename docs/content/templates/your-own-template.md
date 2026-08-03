# Custom and local templates

`ness new` can create an application from an official starter, an npm package, or a directory on the local filesystem.

## Local directory

Pass a relative, absolute, home-relative, or `file:` path:

```bash
ness new my-app --template ./templates/company-app
ness new my-app --template /Users/me/templates/company-app
ness new my-app --template ~/templates/company-app
ness new my-app --template file:../company-app
```

A direct template directory must contain `app/`:

```text
company-app/
├── app/
│   ├── root.tsx
│   └── routes/
├── public/
├── ness.config.mjs
├── tsconfig.json
└── Dockerfile
```

TypeScript is detected automatically from `tsconfig.json`. Ness generates the destination `package.json`, installs the framework dependencies, and copies the remaining files.

## Package-style template

For a template that can also be published to npm, place application files inside `template/`:

```text
company-template/
├── package.json
├── template.json
└── template/
    ├── app/
    ├── public/
    └── ness.config.mjs
```

```json title="package.json"
{
  "name": "@company/ness-template",
  "type": "module",
  "files": ["template", "template.json"],
  "ness": {
    "template": "template"
  }
}
```

The `ness.template` field is optional when the directory is named `template`.

## Package customizations

Use `template.json` to add dependencies, scripts, and supported package metadata:

```json title="template.json"
{
  "package": {
    "description": "Company web application",
    "scripts": {
      "storybook": "storybook dev -p 6006"
    },
    "dependencies": {
      "@company/ui": "^2.0.0"
    },
    "devDependencies": {
      "storybook": "^10.0.0"
    }
  }
}
```

Ness preserves the generated application name, version, ESM mode, private flag, and Node requirement. It merges dependencies, scripts, optional and peer dependencies, Browserslist, ESLint configuration, and npm overrides.

The `prettier` field is also copied into the generated `package.json`, so formatting rules do not require a separate `.prettierrc` file.

## Copy safety

The following development artifacts are never copied from a local template:

- `node_modules`, `.git`, `build`, `dist`, `deploy`, `.react-router`, and `.ness`
- npm, pnpm, Yarn, and Bun lock files
- source `package.json` and `template.json`

The application directory cannot be placed inside the source template directory, preventing recursive copies.

## npm registry template

Published scoped packages can be used directly:

```bash
ness new my-app --template @company/ness-template
```

Unscoped aliases continue to resolve through the `ness-template-*` convention:

```bash
ness new my-app --template commerce
# Installs ness-template-commerce
```
