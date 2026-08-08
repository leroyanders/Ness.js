export interface CompressOptions {
  /** Skip responses smaller than this, when the length is known. Default 1024. */
  threshold?: number;
  /** Encodings to offer, best first. Default `['br', 'gzip']`. */
  encodings?: string[];
}

/** Encodings the server can produce, best first. */
export const ENCODINGS: string[];

/** Content types worth compressing. */
export const COMPRESSIBLE: RegExp;

/**
 * Picks an encoding from an `Accept-Encoding` header, honouring quality values
 * including `q=0`. Returns undefined when nothing on offer is acceptable.
 */
export function negotiateEncoding(
  header: string | null | undefined,
  available?: string[],
): string | undefined;

/** Whether a response is worth compressing and allowed to be. */
export function shouldCompress(
  response: Response,
  options?: CompressOptions,
): boolean;

/** Appends a field to a `Vary` header without duplicating it. */
export function appendVary(headers: Headers, field: string): void;

/**
 * Returns the response compressed for this request, or unchanged when the
 * client accepts nothing we produce or the response should not be transformed.
 */
export function compressResponse(
  request: Request,
  response: Response,
  options?: CompressOptions,
): Response;
