import '../runtime/web-api.js';

const RSC_FEATURE = 'experimental-rsc';

/**
 * What the RSC pipeline can and cannot do today.
 *
 * The build, SSR, hydration, and NestJS routes are covered by the end-to-end
 * suite on every commit, so they are not a guess. The gaps are real gaps, not
 * untested claims: prerendering and the build manifest are disabled by React
 * Router in RSC mode, and standalone bundling depends on the manifest.
 *
 * RSC stays behind a flag because it sits on two upstream APIs that are
 * themselves pre-stable: `@vitejs/plugin-rsc` (0.x) and React Router's
 * `unstable_reactRouterRSC`. Calling it stable here would not make those
 * stable, and would promise a compatibility guarantee this project cannot keep.
 */
const RSC_SUPPORT = Object.freeze({
  supported: Object.freeze([
    'production build',
    'streaming SSR and hydration',
    'server functions',
    'NestJS controllers',
    'route middleware, loaders, and actions',
  ]),
  unsupported: Object.freeze([
    'prerender / SSG (router.prerender is ignored in RSC mode)',
    'the ness-manifest.json build manifest',
    'standalone bundling (ness bundle node), which reads that manifest',
  ]),
  upstream: Object.freeze({
    '@vitejs/plugin-rsc': '0.x',
    'react-router': 'unstable_reactRouterRSC',
  }),
});

function experimentalRsc(options = {}) {
  return { rsc: true, feature: RSC_FEATURE, ...options };
}

/** Programmatic access to the table above, for `ness doctor` and tooling. */
function rscSupport() {
  return RSC_SUPPORT;
}

function assertSerializable(value, path = 'props', seen = new WeakSet()) {
  const type = typeof value;
  if (
    value === null ||
    value === undefined ||
    ['string', 'number', 'boolean'].includes(type)
  )
    return value;
  if (type === 'symbol' && Symbol.keyFor(value) !== undefined) return value;
  if (type === 'function')
    throw new TypeError(
      `${path} contains a function. Pass a server action or serializable data.`,
    );
  if (type === 'bigint')
    throw new TypeError(
      `${path} contains a bigint, which cannot cross the RSC boundary.`,
    );
  if (type !== 'object') return value;
  if (seen.has(value))
    throw new TypeError(`${path} contains a circular reference.`);
  if (
    value instanceof Date ||
    value instanceof Map ||
    value instanceof Set ||
    value instanceof URL ||
    value instanceof FormData
  )
    return value;
  if (
    Object.getPrototypeOf(value) !== Object.prototype &&
    !Array.isArray(value)
  ) {
    throw new TypeError(
      `${path} contains a class instance. Pass a plain object instead.`,
    );
  }
  seen.add(value);
  if (Array.isArray(value))
    value.forEach((item, index) =>
      assertSerializable(item, `${path}[${index}]`, seen),
    );
  else
    Object.entries(value).forEach(([key, item]) =>
      assertSerializable(item, `${path}.${key}`, seen),
    );
  seen.delete(value);
  return value;
}

function serverOnly(callback) {
  if (typeof callback !== 'function')
    throw new TypeError('serverOnly() expects a function.');
  return function serverOnlyFunction(...args) {
    if (typeof window !== 'undefined')
      throw new Error('A server-only function was called in the browser.');
    return callback.apply(this, args);
  };
}

export {
  RSC_FEATURE,
  RSC_SUPPORT,
  assertSerializable,
  experimentalRsc,
  rscSupport,
  serverOnly,
};
