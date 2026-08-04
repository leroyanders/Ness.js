# @nessframework/typescript

The starter `ness new` scaffolds by default: strict TypeScript, end to end.

It includes typed React routes, a NestJS backend and health controller, streaming SSR, a cached server loader, route boundaries, prerendering, optional RSC mode, instrumentation, a unified `ness.config.mjs`, and a production Dockerfile.

```bash
ness new my-app
```

`--template typescript` still selects it explicitly, which is worth spelling out in a script that should keep scaffolding TypeScript whatever the default becomes.

Experimental RSC mode:

```bash
ness new my-app --rsc
```
