export * from './image.js';
export interface RemotePattern {
  protocol?: string;
  hostname?: string;
  port?: string | number;
  pathname?: string;
}
export interface ImageVariantCacheOptions {
  /** How long an encoded variant is kept. Defaults to `days`. */
  life?: 'seconds' | 'minutes' | 'hours' | 'days' | 'max' | 'default';
  /** Tags for invalidation. Defaults to `['images']`. */
  tags?: string[];
}

export interface ImageHandlerOptions {
  publicDirectory?: string;
  remotePatterns?: Array<string | RemotePattern>;
  widths?: number[];
  maximumWidth?: number;
  cacheControl?: string;
  /**
   * Where encoded variants are kept, through the application's configured
   * cache — so a second instance reuses the work rather than repeating it.
   * `false` re-encodes on every request.
   */
  cache?: ImageVariantCacheOptions | false;
  /**
   * Concurrent encodes. Defaults to 4. Without a cap, a burst of misses starts
   * one sharp pipeline per request.
   */
  concurrency?: number;
}
export function createImageHandler(
  options?: ImageHandlerOptions,
): (request: Request) => Promise<Response>;
export function matchesRemote(
  url: URL,
  patterns: Array<string | RemotePattern>,
): boolean;
