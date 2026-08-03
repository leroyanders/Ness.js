import '../runtime/web-api.js';

const RSC_FEATURE = 'experimental-rsc';

function experimentalRsc(options = {}) {
  return { rsc: true, feature: RSC_FEATURE, ...options };
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

export { RSC_FEATURE, assertSerializable, experimentalRsc, serverOnly };
