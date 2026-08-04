<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/typescript</h1>

<p align="center">Official strict TypeScript starter for Ness.js, and what ness new scaffolds by default.</p>

It includes typed React routes, a NestJS backend and health controller, streaming SSR, a cached server loader, route boundaries, prerendering, optional RSC mode, instrumentation, a unified `ness.config.mjs`, and a production Dockerfile.

```bash
ness new my-app
```

`--template typescript` still selects it explicitly, which is worth spelling out in a script that should keep scaffolding TypeScript whatever the default becomes.

Experimental RSC mode:

```bash
ness new my-app --rsc
```
