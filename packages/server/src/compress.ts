import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { constants, createBrotliCompress, createGzip } from 'node:zlib';
import type { Transform } from 'node:stream';

export interface CompressOptions {
  /** Skip responses smaller than this, when the length is known. Default 1024. */
  threshold?: number;
  /** Encodings to offer, the best first. Default `['br', 'gzip']`. */
  encodings?: string[];
}

/**
 * Response compression for the production server.
 *
 * Built on `node:zlib` rather than `CompressionStream`. The web stream only
 * takes brotli under a non-standard name and not on every Node in the support
 * range, and quietly falling back to gzip on some of them would make the
 * shipped bytes depend on which Node the deployment happened to have.
 */

/** Encodings we can produce, the best first. */
const ENCODINGS = ['br', 'gzip'];

/**
 * Types worth compressing. Everything else is either already compressed —
 * images, video, fonts, archives — where a second pass costs CPU and returns
 * nothing, or occasionally grows the payload.
 */
const COMPRESSIBLE =
  /^(?:text\/|application\/(?:json|.*\+json|javascript|xml|.*\+xml|manifest\+json|wasm)|image\/svg\+xml)/i;

/** Below this, the framing costs more than the compression saves. */
const DEFAULT_THRESHOLD = 1024;

/**
 * Picks an encoding from an `Accept-Encoding` header.
 *
 * Honors quality values, including `q=0`, which is how a client says "not
 * this one" rather than "no preference". `identity;q=0` with no other
 * acceptable encoding is a client asking for something we cannot give, and is
 * answered by not compressing rather than by a 406 — a slightly larger
 * response is better than no response.
 */
function negotiateEncoding(
  header: string | null | undefined,
  available: string[] = ENCODINGS,
): string | undefined {
  if (!header) return undefined;

  const preferences = new Map<string, number>();
  for (const part of header.split(',')) {
    const [name, ...parameters] = part.trim().split(';');
    if (!name) continue;
    const quality = parameters
      .map(parameter => parameter.trim())
      .find(parameter => parameter.startsWith('q='));
    preferences.set(
      name.trim().toLowerCase(),
      quality ? Number(quality.slice(2)) : 1,
    );
  }

  const wildcard = preferences.get('*');
  let best: string | undefined;
  let bestQuality = 0;

  for (const encoding of available) {
    const quality = preferences.get(encoding) ?? wildcard;
    if (!quality || quality <= 0) continue;
    if (quality > bestQuality) {
      best = encoding;
      bestQuality = quality;
    }
  }

  return best;
}

/**
 * Whether this response should be compressed at all.
 *
 * `no-transform` is the caller's explicit instruction that the bytes must
 * arrive as sent, and an already-encoded response must not be encoded twice.
 * A 204 or a 304 has nobody to work on.
 */
function shouldCompress(
  response: Response,
  { threshold = DEFAULT_THRESHOLD }: CompressOptions = {},
): boolean {
  if (!response.body) return false;
  if (response.status === 204 || response.status === 304) return false;
  if (response.headers.has('content-encoding')) return false;
  if ((response.headers.get('cache-control') || '').includes('no-transform'))
    return false;
  if (!COMPRESSIBLE.test(response.headers.get('content-type') || ''))
    return false;

  // Only decidable when the length is known; a streamed response is compressed
  // rather than buffered to measure it, which would give up the streaming.
  const length = response.headers.get('content-length');
  return !(length !== null && Number(length) < threshold);
}

function compressor(encoding: string): Transform {
  return encoding === 'br'
    ? createBrotliCompress({
        params: {
          // 11 is for build-time assets. For a response rendered per request,
          // the extra seconds cost more than the bytes save.
          [constants.BROTLI_PARAM_QUALITY]: 5,
          [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        },
      })
    : createGzip({ level: 6 });
}

/**
 * Returns the response compressed, or the response unchanged.
 *
 * `content-length` is dropped rather than recalculated: the compressed length
 * is not known until the stream ends, and a wrong one is worse than none.
 * `vary` is appended so a shared cache keeps the encodings apart.
 */
function compressResponse(
  request: Request,
  response: Response,
  options: CompressOptions = {},
): Response {
  if (!shouldCompress(response, options)) return response;

  const encoding = negotiateEncoding(
    request.headers.get('accept-encoding'),
    options.encodings || ENCODINGS,
  );
  if (!encoding) return response;

  // `shouldCompress` already rejected a body-less response; the node:stream and
  // DOM stream types describe the same object and do not know about each other.
  const source = Readable.fromWeb(
    response.body as unknown as NodeReadableStream,
  );
  const body = Readable.toWeb(
    source.pipe(compressor(encoding)),
  ) as unknown as ReadableStream;

  const headers = new Headers(response.headers);
  headers.set('content-encoding', encoding);
  headers.delete('content-length');
  appendVary(headers, 'accept-encoding');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function appendVary(headers: Headers, field: string): void {
  const existing = headers.get('vary');
  if (!existing) return headers.set('vary', field);
  if (existing === '*') return;
  const values = existing.split(',').map(value => value.trim().toLowerCase());
  if (!values.includes(field)) headers.set('vary', `${existing}, ${field}`);
}

export {
  COMPRESSIBLE,
  ENCODINGS,
  appendVary,
  compressResponse,
  negotiateEncoding,
  shouldCompress,
};
