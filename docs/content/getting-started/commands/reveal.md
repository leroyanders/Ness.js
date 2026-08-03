# `ness reveal`

Writes a framework-owned entry module into the application so its behavior can be customized.

```bash
ness reveal <entry> [options]
```

Supported entries:

- `entry.client` — browser hydration and client startup
- `entry.server` — streaming SSR and response creation

```bash
ness reveal entry.server
ness reveal entry.client --no-typescript
```

TypeScript output is used by default. Add `--no-typescript` for JavaScript. Reveal an entry only when custom hydration, CSP nonce handling, streaming timeouts, or response behavior is required; the framework defaults remain preferable for most applications.
