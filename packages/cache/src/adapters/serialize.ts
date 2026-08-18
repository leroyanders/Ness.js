import type { CacheEntry, CacheLife } from '../index.js';

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

/** A binary value once it has been flattened into something JSON can carry. */
export interface BinaryMarker {
  [BINARY]: string;
  kind: string;
}

/** `life` as it is stored: `Infinity` is not valid JSON. */
export interface EncodedLife {
  stale: number;
  revalidate: number;
  expire: number | typeof INFINITY;
}

function encodeBinary(bytes: Buffer, kind: string): BinaryMarker {
  return { [BINARY]: bytes.toString('base64'), kind };
}

/** Reads the original value off the holder: `toJSON` has already run on it. */
function binaryReplacer(
  this: Record<string, unknown>,
  key: string,
  value: unknown,
): unknown {
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

type TypedArrayConstructor = new (buffer: ArrayBuffer) => ArrayBufferView;

function decodeBinary(marker: BinaryMarker): unknown {
  const buffer = Buffer.from(marker[BINARY], 'base64');
  if (marker.kind === 'Buffer') return buffer;

  // A fresh ArrayBuffer, not a window onto the pool Buffer.from allocated from.
  const bytes = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  if (marker.kind === 'ArrayBuffer') return bytes;
  const View = (globalThis as Record<string, unknown>)[marker.kind] as
    TypedArrayConstructor | undefined;
  return typeof View === 'function' ? new View(bytes) : buffer;
}

function isBinaryMarker(value: unknown): value is BinaryMarker {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>)[BINARY] === 'string'
  );
}

/**
 * Restores markers anywhere in the value.
 *
 * An adapter may hand back a parsed object rather than a string — a Redis
 * client configured to parse JSON, for instance — so reviving cannot rely on
 * `JSON.parse` having done it.
 */
function revive(value: unknown): unknown {
  if (isBinaryMarker(value)) return decodeBinary(value);
  if (Array.isArray(value)) return value.map(revive);
  if (value !== null && typeof value === 'object') {
    const revived: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value))
      revived[key] = revive(item);
    return revived;
  }
  return value;
}

function encodeLife(life: Required<CacheLife>): EncodedLife {
  return {
    stale: life.stale,
    revalidate: life.revalidate,
    expire: life.expire === Infinity ? INFINITY : life.expire,
  };
}

function decodeLife(life: EncodedLife): Required<CacheLife> {
  return {
    stale: life.stale,
    revalidate: life.revalidate,
    expire: life.expire === INFINITY ? Infinity : (life.expire as number),
  };
}

function encodeEntry(key: string, entry: CacheEntry): string {
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

interface EncodedEntry {
  key?: string;
  value: unknown;
  createdAt: number;
  life: EncodedLife;
  tags?: string[];
  path?: string;
}

function decodeEntry(
  source: string | object | null | undefined,
): CacheEntry | undefined {
  if (source == null) return undefined;
  const raw = (
    typeof source === 'string' ? JSON.parse(source) : source
  ) as EncodedEntry;
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
function expiryMs(entry: CacheEntry): number | undefined {
  if (!Number.isFinite(entry.life.expire)) return undefined;
  return Math.max(1, Math.ceil(entry.life.expire * 1000));
}

function matchesPath(entryPath: string | undefined, pathname: string): boolean {
  if (!entryPath) return false;
  return entryPath === pathname || entryPath.startsWith(`${pathname}/`);
}

function encodeName(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeName(value: string): string {
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
