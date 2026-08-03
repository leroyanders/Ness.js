import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import * as image from './image.js';
import '@nessframework/server/web-api';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesRemote(url, patterns) {
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

async function readSource(source, { publicDirectory, remotePatterns, signal }) {
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
} = {}) {
  const allowedWidths = new Set(widths.map(Number));
  return async function handleImage(request) {
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
    try {
      const input = await readSource(source, {
        publicDirectory,
        remotePatterns,
        signal: request.signal,
      });
      const accept = request.headers.get('accept') || '';
      const pipeline = sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true });
      let contentType = 'image/jpeg';
      if (accept.includes('image/avif')) {
        pipeline.avif({ quality });
        contentType = 'image/avif';
      } else if (accept.includes('image/webp')) {
        pipeline.webp({ quality });
        contentType = 'image/webp';
      } else {
        pipeline.jpeg({ quality, mozjpeg: true });
      }
      const output = await pipeline.toBuffer();
      return new Response(output, {
        headers: {
          'cache-control': cacheControl,
          'content-length': String(output.byteLength),
          'content-type': contentType,
          vary: 'Accept',
        },
      });
    } catch (error) {
      if (error instanceof Response) return error;
      if (error.code === 'ENOENT')
        return new Response('Image not found.', { status: 404 });
      return new Response('Unable to optimize image.', { status: 500 });
    }
  };
}

const { DEFAULT_WIDTHS, Image, imageUrl } = image;

export { DEFAULT_WIDTHS, Image, createImageHandler, imageUrl, matchesRemote };
