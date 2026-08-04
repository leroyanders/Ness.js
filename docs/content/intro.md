---
sidebar_position: 1
---

# Ness.js

Ness.js is a full-stack React framework for applications that render on the server and navigate in the browser. Version 7 provides file-routed React UI, a NestJS backend, streaming SSR, typed data loading and mutations, caching shared across instances, localized routing, optimized assets, and self-hosted deployment that ships as a single directory.

The framework uses React 19, React Router Framework Mode, Vite 8, and standard `Request`/`Response` APIs. The default runtime is Node.js; Cloudflare Workers and AWS Lambda adapters are available when an application only uses APIs supported by the target runtime.

## Why Ness

- React file routes for SSR, navigation, loaders, and actions, plus NestJS controllers for public APIs
- Convention-based files without hiding the underlying Web APIs
- Streaming, code splitting, prefetching, and progressive enhancement by default
- Built-in cache profiles, request deduplication, SWR, tag invalidation, SSG, and ISR
- Production runtime that can be self-hosted without a platform-specific service
- Escape hatches through Vite plugins, React Router configuration, middleware, and deployment adapters

Start with [Create a new application](./getting-started/create-new-app.md).

The [Ness CLI](./getting-started/commands.md) can then install official plugins, generate routes and services, inspect the route tree, update framework packages, and diagnose the project.
