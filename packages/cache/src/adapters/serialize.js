const INFINITY = '__ness_infinity__';

function encodeLife(life) {
  return {
    stale: life.stale,
    revalidate: life.revalidate,
    expire: life.expire === Infinity ? INFINITY : life.expire,
  };
}

function decodeLife(life) {
  return {
    stale: life.stale,
    revalidate: life.revalidate,
    expire: life.expire === INFINITY ? Infinity : life.expire,
  };
}

function encodeEntry(key, entry) {
  return JSON.stringify({
    key,
    value: entry.value,
    createdAt: entry.createdAt,
    life: encodeLife(entry.life),
    tags: entry.tags || [],
    path: entry.path,
  });
}

function decodeEntry(source) {
  if (source == null) return undefined;
  const raw = typeof source === 'string' ? JSON.parse(source) : source;
  return {
    value: raw.value,
    createdAt: raw.createdAt,
    life: decodeLife(raw.life),
    tags: raw.tags || [],
    path: raw.path,
  };
}

/**
 * Entries live for `expire` seconds. Shared stores are told the same thing so a
 * crashed process cannot leave an entry behind forever.
 */
function expiryMs(entry) {
  if (!Number.isFinite(entry.life.expire)) return undefined;
  return Math.max(1, Math.ceil(entry.life.expire * 1000));
}

function matchesPath(entryPath, pathname) {
  if (!entryPath) return false;
  return entryPath === pathname || entryPath.startsWith(`${pathname}/`);
}

function encodeName(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeName(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export {
  decodeEntry,
  decodeLife,
  decodeName,
  encodeEntry,
  encodeLife,
  encodeName,
  expiryMs,
  matchesPath,
};
