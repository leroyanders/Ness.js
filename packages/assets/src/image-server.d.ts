export * from './image.js';
export interface RemotePattern {
  protocol?: string;
  hostname?: string;
  port?: string | number;
  pathname?: string;
}
export interface ImageHandlerOptions {
  publicDirectory?: string;
  remotePatterns?: Array<string | RemotePattern>;
  widths?: number[];
  maximumWidth?: number;
  cacheControl?: string;
}
export function createImageHandler(
  options?: ImageHandlerOptions,
): (request: Request) => Promise<Response>;
export function matchesRemote(
  url: URL,
  patterns: Array<string | RemotePattern>,
): boolean;
