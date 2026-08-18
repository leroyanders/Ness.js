import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getCache } from '@nessframework/cache';
import type { CacheProfile } from '@nessframework/cache';
import * as image from './image.js';
import '@nessframework/server/web-api';

export * from './image.js';

export interface RemotePattern {
  protocol?: string;
  hostname?: string;
  port?: string | number;
  pathname?: string;
}

export interface ImageVariantCacheOptions {
  /** How long an encoded variant is kept. Defaults to `days`. */
  life?: CacheProfile;
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

type SharpFactory = (typeof import('sharp'))['default'];

/**
 * sharp is a native module and costs roughly 700 ms to load — by a wide margin
 * the largest single item in a server's cold start. Applications that never
 * serve an optimized image should not pay it at all, and those that do should
 * pay it on the first image request rather than before accepting traffic.
 */
let sharpModule: Promise<SharpFactory> | undefined;
function loadSharp(): Promise<SharpFactory> {
  sharpModule ??= import('sharp').then(
    module => (module.default || module) as SharpFactory,
  );
  return sharpModule;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesRemote(
  url: URL,
  patterns: Array<string | RemotePattern>,
): boolean {
  return patterns.some(pattern => {
    if (typeof pattern === 'string')
      return url.origin === pattern || url.hostname === pattern;
    if (
      pattern.protocol &&
      url.protocol !== `${pattern.protocol.replace(/:$/, '')}:`
    )
      return false;
    if (pattern.hostname) {
      const hostname = escapeRegExp(pattern.hostname)
        .replace(/^\\\*\\\*\./, '(?:.+\\.)?')
        .replace(/^\\\*\./, '[^.]+\\.');
      if (!new RegExp(`^${hostname}$`).test(url.hostname)) return false;
    }
    if (pattern.port && url.port !== String(pattern.port)) return false;
    if (pattern.pathname) {
      const expression = new RegExp(
        `^${pattern.pathname
          .split('**')
          .map(part => part.split('*').map(escapeRegExp).join('[^/]*'))
          .join('.*')}$`,
      );
      if (!expression.test(url.pathname)) return false;
    }
    return true;
  });
}

/**
 * A fingerprint of the source, so a replaced file produces a different variant
 * key instead of serving the old encoding under the new URL.
 *
 * Local files use size and mtime, which is what every static server already
 * trusts for an ETag. A remote source has no cheap equivalent — fetching it to
 * hash it defeats the point — so remote variants are keyed by URL alone and
 * rely on `expire` to age out.
 */
async function sourceVersion(
  source: string,
  publicDirectory: string,
): Promise<string> {
  if (/^https?:\/\//i.test(source)) return 'remote';
  try {
    const relative = source.replace(/^\/+/, '');
    const root = path.resolve(publicDirectory);
    const filename = path.resolve(root, relative);
    if (filename !== root && !filename.startsWith(`${root}${path.sep}`))
      return 'invalid';
    const stats = await fs.stat(filename);
    return `${stats.size}-${Math.floor(stats.mtimeMs)}`;
  } catch {
    return 'missing';
  }
}

/**
 * Caps concurrent encodes.
 *
 * sharp releases the event loop while it works, so without a cap a burst of
 * misses starts one pipeline per request and the pool ends up thrashing —
 * every request slower, and memory proportional to the burst rather than to
 * the work.
 */
function createLimiter(
  limit: number,
): <T>(job: () => Promise<T>) => Promise<T> {
  let active = 0;
  const waiting: Array<() => void> = [];

  const release = () => {
    active -= 1;
    waiting.shift()?.();
  };

  return async function run<T>(job: () => Promise<T>): Promise<T> {
    if (active >= limit)
      await new Promise<void>(resolve => {
        waiting.push(resolve);
      });
    active += 1;
    try {
      return await job();
    } finally {
      release();
    }
  };
}

async function readSource(
  source: string,
  {
    publicDirectory,
    remotePatterns,
    signal,
  }: {
    publicDirectory: string;
    remotePatterns: Array<string | RemotePattern>;
    signal: AbortSignal;
  },
): Promise<Buffer> {
  if (/^https?:\/\//i.test(source)) {
    const url = new URL(source);
    if (!matchesRemote(url, remotePatterns))
      throw new Response('Remote image host is not allowed.', { status: 403 });
    const response = await fetch(url, { signal, redirect: 'error' });
    if (!response.ok)
      throw new Response('Unable to fetch source image.', {
        status: response.status,
      });
    return Buffer.from(await response.arrayBuffer());
  }
  const relative = source.replace(/^\/+/, '');
  const root = path.resolve(publicDirectory);
  const filename = path.resolve(root, relative);
  if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
    throw new Response('Invalid image path.', { status: 400 });
  }
  return fs.readFile(filename);
}

function createImageHandler({
  publicDirectory = path.join(process.cwd(), 'public'),
  remotePatterns = [],
  widths = image.DEFAULT_WIDTHS,
  maximumWidth = 3840,
  cacheControl = 'public, max-age=31536000, immutable',
  /**
   * How long an encoded variant is kept. Through the configured cache, so a
   * second instance gets the work the first one already did instead of
   * repeating it.
   */
  cache: cacheOptions = {},
  /** Concurrent encodes. Defaults to something a small container survives. */
  concurrency = 4,
}: ImageHandlerOptions = {}): (request: Request) => Promise<Response> {
  const allowedWidths = new Set(widths.map(Number));
  const caching = cacheOptions !== false;
  const life: CacheProfile = (cacheOptions || {}).life ?? 'days';
  const tags = (cacheOptions || {}).tags ?? ['images'];
  const limit = createLimiter(concurrency);

  return async function handleImage(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const source = url.searchParams.get('url');
    const requestedWidth = Number(url.searchParams.get('w'));
    const quality = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get('q')) || 75),
    );
    if (
      !source ||
      !Number.isInteger(requestedWidth) ||
      requestedWidth < 1 ||
      requestedWidth > maximumWidth
    ) {
      return new Response('Invalid image parameters.', { status: 400 });
    }
    const width = allowedWidths.has(requestedWidth)
      ? requestedWidth
      : widths.reduce((best, candidate) =>
          Math.abs(candidate - requestedWidth) < Math.abs(best - requestedWidth)
            ? candidate
            : best,
        );
    // The negotiated format is part of the identity of the variant: the same
    // source at the same width is a different file as AVIF than as JPEG.
    const accept = request.headers.get('accept') || '';
    const format = accept.includes('image/avif')
      ? 'avif'
      : accept.includes('image/webp')
        ? 'webp'
        : 'jpeg';
    const contentType = `image/${format}`;

    try {
      const version = await sourceVersion(source, publicDirectory);
      const key = `image:${format}:${width}:${quality}:${version}:${source}`;
      const etag = `"${createHash('sha1').update(key).digest('base64url')}"`;

      // Answered before any work, and before the cache is even read: the client
      // is telling us it already holds this exact variant.
      if (request.headers.get('if-none-match') === etag) {
        return new Response(null, {
          status: 304,
          headers: { 'cache-control': cacheControl, etag, vary: 'Accept' },
        });
      }

      const encode = async (): Promise<Buffer> => {
        const input = await readSource(source, {
          publicDirectory,
          remotePatterns,
          signal: request.signal,
        });
        return limit(async () => {
          const sharp = await loadSharp();
          const pipeline = sharp(input)
            .rotate()
            .resize({ width, withoutEnlargement: true });
          if (format === 'avif') pipeline.avif({ quality });
          else if (format === 'webp') pipeline.webp({ quality });
          else pipeline.jpeg({ quality, mozjpeg: true });
          return pipeline.toBuffer();
        });
      };

      // `getOrSet` collapses a stampede: several requests for the same missing
      // variant produce one encode, not one each.
      const output = caching
        ? await getCache().getOrSet(key, encode, { life, tags })
        : await encode();

      const bytes = Buffer.isBuffer(output) ? output : Buffer.from(output);
      // This module needs the DOM lib for the client-side `Image`, and a
      // Node Buffer does not line up with the DOM's BodyInit even though the
      // runtime Response here is Node's own and takes it directly.
      return new Response(bytes as unknown as BodyInit, {
        headers: {
          'cache-control': cacheControl,
          'content-length': String(bytes.byteLength),
          'content-type': contentType,
          etag,
          vary: 'Accept',
        },
      });
    } catch (error) {
      if (error instanceof Response) return error;
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT')
        return new Response('Image not found.', { status: 404 });
      return new Response('Unable to optimize image.', { status: 500 });
    }
  };
}

const { DEFAULT_WIDTHS, Image, imageUrl } = image;

export { DEFAULT_WIDTHS, Image, createImageHandler, imageUrl, matchesRemote };
