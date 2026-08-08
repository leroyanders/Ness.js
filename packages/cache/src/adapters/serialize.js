const INFINITY = '__ness_infinity__';

/**
 * Binary survives the trip through a shared store.
 *
 * `JSON.stringify` turns an ArrayBuffer into `{}` and a Buffer into a list of
 * integers, so a cached page body — which is an ArrayBuffer — came back as an
 * empty object from the filesystem, SQLite and Redis adapters. The entry was
 * still a hit, so the corruption surfaced as a blank response rather than an
 * error. Only the in-process store was unaffected, which is why it held up in
 * development.
 *
 * Base64 costs a third more space than the raw bytes. Teaching every adapter to
 * carry a binary column would avoid that and cost far more than it saves.
 */
const BINARY = '__ness_binary__';

function encodeBinary(bytes, kind) {
  return { [BINARY]: bytes.toString('base64'), kind };
}

/** Reads the original value off the holder: `toJSON` has already run on it. */
function binaryReplacer(key, value) {
  const original = this[key];
  if (Buffer.isBuffer(original)) return encodeBinary(original, 'Buffer');
  if (original instanceof ArrayBuffer)
    return encodeBinary(Buffer.from(original), 'ArrayBuffer');
  if (ArrayBuffer.isView(original))
    return encodeBinary(
      Buffer.from(original.buffer, original.byteOffset, original.byteLength),
      original.constructor.name,
    );
  return value;
}

function decodeBinary(marker) {
  const buffer = Buffer.from(marker[BINARY], 'base64');
  if (marker.kind === 'Buffer') return buffer;

  // A fresh ArrayBuffer, not a window onto the pool Buffer.from allocated from.
  const bytes = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  if (marker.kind === 'ArrayBuffer') return bytes;
  const View = globalThis[marker.kind];
  return typeof View === 'function' ? new View(bytes) : buffer;
}

function isBinaryMarker(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value[BINARY] === 'string'
  );
}

/**
 * Restores markers anywhere in the value.
 *
 * An adapter may hand back a parsed object rather than a string — a Redis
 * client configured to parse JSON, for instance — so reviving cannot rely on
 * `JSON.parse` having done it.
 */
function revive(value) {
  if (isBinaryMarker(value)) return decodeBinary(value);
  if (Array.isArray(value)) return value.map(revive);
  if (value !== null && typeof value === 'object') {
    const revived = {};
    for (const [key, item] of Object.entries(value))
      revived[key] = revive(item);
    return revived;
  }
  return value;
}

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
  return JSON.stringify(
    {
      key,
      value: entry.value,
      createdAt: entry.createdAt,
      life: encodeLife(entry.life),
      tags: entry.tags || [],
      path: entry.path,
    },
    binaryReplacer,
  );
}

function decodeEntry(source) {
  if (source == null) return undefined;
  const raw = typeof source === 'string' ? JSON.parse(source) : source;
  return {
    value: revive(raw.value),
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
  BINARY,
  decodeEntry,
  decodeLife,
  decodeName,
  encodeEntry,
  encodeLife,
  encodeName,
  expiryMs,
  matchesPath,
  revive,
};
