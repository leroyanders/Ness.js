<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/cli</h1>

<p align="center">Develop, build, diagnose, and create Ness.js applications.</p>

The official Ness.js command line interface.

```bash
npm install --global @nessframework/cli
ness new my-app
```

Commands:

```text
ness new|n <name> [--template <name-or-path>] [--rsc]
ness dev [--host 0.0.0.0] [--port 3000] [--open]
ness build [--mode production] [--sourcemap-client]
ness start [--host 0.0.0.0] [--port 3000]
ness typegen [--watch]
ness routes [--json]
ness reveal entry.client|entry.server
ness add <package> [--dev] [--exact] [--dry-run]
ness remove|rm <package> [--dry-run]
ness update [packages...] [--tag latest] [--dry-run]
ness clean [--coverage] [--dry-run]
ness generate|g <type> <name> [--dry-run] [--force]
ness doctor
ness info
```

Generators support React routes and boundaries plus `component`, `action`, `middleware`, `hook`, `context`, `model`, `class`, `interface`, `enum`, and `test`. NestJS backend schematics include `controller`, `resource`, `service`, `module`, and `guard`; the CLI writes them to `app/server` and registers them in the root `AppModule`. Nest-style aliases such as `p`, `co`, `res`, `s`, `mo`, `mi`, `gu`, and `spec` are available.

Official aliases passed to `ness add`, `remove`, or `update` resolve to the `@nessframework/*` scope, so `ness add tailwind` installs `@nessframework/tailwind`.

`--template` accepts the official `default`, `typescript`, `minimal`, `api`, and `dashboard` aliases, npm packages, package-style templates, and direct local directories through relative, absolute, `~/`, or `file:` paths. Official starters keep framework settings in one `ness.config.mjs` file.

Node.js 20.19 or newer is required.
