import { cache } from 'react';
import '../runtime/web-api.js';

export interface RscSupport {
  /** Verified by the end-to-end suite on every commit. */
  readonly supported: readonly string[];
  /** Known gaps, not untested claims. */
  readonly unsupported: readonly string[];
  /** Pre-stable upstream APIs the pipeline is built on. */
  readonly upstream: Readonly<Record<string, string>>;
}

const RSC_FEATURE = 'rsc';

/**
 * React 19's per-render memoization, re-exported under a name that does not
 * collide with `@nessframework/cache`'s `cached()` — the two solve different
 * problems. `requestCache` dedupes repeated calls with the same arguments
 * *within a single render* (no TTL, nothing persisted); `cached()` is
 * cross-request, TTL/tag-based ISR-style caching. Use `requestCache` to wrap
 * a data function called from more than one Server Component in the same
 * tree, so it fetches once per render instead of once per call site.
 */
const requestCache = cache;

/**
 * What the RSC pipeline can and cannot do today.
 *
 * Everything in `supported` is verified against a real build and a real
 * browser, not a guess — including the one entry in `unsupported`, which was
 * found the same way: manually reproduced, isolated to its exact trigger, and
 * confirmed to come from `react-router`'s own client entry rather than
 * anything Ness generates. `ness-manifest.json` is written from a Vite
 * `buildApp` hook fed by Ness's own route tree rather than React Router's
 * `buildEnd`, because RSC Framework Mode's `validateConfig` rejects
 * `buildEnd` outright — see `writeRscManifest` in `@nessframework/router/vite`.
 * `router.prerender` needed no RSC-specific handling at all once Ness stopped
 * stripping it before React Router's own RSC prerender plugin ever saw it —
 * an earlier version of this table listed it as an upstream limitation, which
 * was never actually true on `@react-router/dev@8.3.0`.
 *
 * The one real gap: a route whose `page`/`layout` default export is itself an
 * `async` function component (a genuine Server Component doing its own data
 * fetching, no `page.server.js` loader) renders correct, fully-formed HTML on
 * the initial response — that part works — but client-side hydration of that
 * route then fails with a React error ("Only Server Components can be async
 * at the moment"), independent of whether the page uses `'use client'` or
 * `'use server'` at all. This reproduces with zero interactive children, so
 * it is not about `'use client'`/`'use server'` specifically — `'use client'`
 * composition and hydration, and calling a `'use server'` function directly
 * from a `'use client'` component, both work cleanly on any route whose page
 * component is a normal (non-async) function. Until React Router's RSC client
 * entry handles this, keep data fetching in a `page.server.js` loader for any
 * route that needs to stay interactive after the first paint — which is the
 * existing, fully-supported pattern every official template already uses.
 *
 * RSC is the default mode `ness new` scaffolds, but it still sits on two
 * upstream APIs that are themselves pre-stable: `@vitejs/plugin-rsc` (0.x)
 * and React Router's `unstable_reactRouterRSC`. Calling either of those
 * stable here would not make them stable, and would promise a compatibility
 * guarantee this project cannot keep — hence `upstream` below, not a claim
 * that RSC itself is opt-in or unsupported.
 */
const RSC_SUPPORT: RscSupport = Object.freeze({
  supported: Object.freeze([
    'production build',
    'streaming SSR and hydration (routes with a non-async page/layout component — loaders, useLoaderData)',
    "'use client' component composition and hydration",
    "'use server' functions, called via a route action or directly from a 'use client' component",
    'NestJS controllers',
    'route middleware, loaders, and actions',
    'the ness-manifest.json build manifest',
    'standalone bundling (ness bundle node)',
    'prerender / SSG (router.prerender)',
  ]),
  unsupported: Object.freeze([
    "hydrating a route whose page/layout default export is an async function component (real Server Components render correctly server-side; client-side hydration of that route then fails — react-router's RSC client entry, not something Ness generates)",
  ]),
  upstream: Object.freeze({
    '@vitejs/plugin-rsc': '0.x',
    'react-router': 'unstable_reactRouterRSC',
  }),
});

function rscConfig<T extends Record<string, unknown>>(
  options: T = {} as T,
): T & { rsc: true; feature: string } {
  return { rsc: true, feature: RSC_FEATURE, ...options } as T & {
    rsc: true;
    feature: string;
  };
}

/** Programmatic access to the table above, for `ness doctor` and tooling. */
function rscSupport(): RscSupport {
  return RSC_SUPPORT;
}

function assertSerializable<T>(
  value: T,
  path = 'props',
  seen: WeakSet<object> = new WeakSet(),
): T {
  const type = typeof value;
  if (
    value === null ||
    value === undefined ||
    ['string', 'number', 'boolean'].includes(type)
  )
    return value;
  if (type === 'symbol' && Symbol.keyFor(value as symbol) !== undefined)
    return value;
  if (type === 'function')
    throw new TypeError(
      `${path} contains a function. Pass a server action or serializable data.`,
    );
  if (type === 'bigint')
    throw new TypeError(
      `${path} contains a bigint, which cannot cross the RSC boundary.`,
    );
  if (type !== 'object') return value;
  const object = value as object;
  if (seen.has(object))
    throw new TypeError(`${path} contains a circular reference.`);
  if (
    object instanceof Date ||
    object instanceof Map ||
    object instanceof Set ||
    object instanceof URL ||
    object instanceof FormData
  )
    return value;
  if (
    Object.getPrototypeOf(object) !== Object.prototype &&
    !Array.isArray(object)
  ) {
    throw new TypeError(
      `${path} contains a class instance. Pass a plain object instead.`,
    );
  }
  seen.add(object);
  if (Array.isArray(object))
    object.forEach((item, index) =>
      assertSerializable(item, `${path}[${index}]`, seen),
    );
  else
    Object.entries(object).forEach(([key, item]) =>
      assertSerializable(item, `${path}.${key}`, seen),
    );
  seen.delete(object);
  return value;
}

function serverOnly<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result {
  if (typeof callback !== 'function')
    throw new TypeError('serverOnly() expects a function.');
  return function serverOnlyFunction(this: unknown, ...args: Args): Result {
    if (typeof window !== 'undefined')
      throw new Error('A server-only function was called in the browser.');
    return callback.apply(this, args);
  };
}

export {
  RSC_FEATURE,
  RSC_SUPPORT,
  assertSerializable,
  requestCache,
  rscConfig,
  rscSupport,
  serverOnly,
};
