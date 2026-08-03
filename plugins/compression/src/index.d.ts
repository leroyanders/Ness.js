import type { Plugin } from 'vite';

export interface CompressionOptions {
  threshold?: number;
  algorithms?: Array<'gzip' | 'brotli'>;
  gzipLevel?: number;
  brotliQuality?: number;
  test?: RegExp | ((filename: string) => boolean);
}

export interface CompressedAsset {
  filename: string;
  source: Uint8Array;
}

export function compression(options?: CompressionOptions): Plugin;
export function compressAsset(
  filename: string,
  source: string | Uint8Array,
  options?: CompressionOptions,
): CompressedAsset[];
export function install(config: object, options?: CompressionOptions): object;
export default compression;
