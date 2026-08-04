import type { CacheAdapter, CacheEntry } from '../index.js';

export interface FileSystemCacheAdapterOptions {
  /** Defaults to `<cwd>/.ness/cache`. */
  directory?: string;
}

export class FileSystemCacheAdapter implements CacheAdapter {
  constructor(options?: FileSystemCacheAdapterOptions);
  readonly directory: string;
  get(key: string): Promise<CacheEntry | undefined>;
  set(key: string, entry: CacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  keysByTag(tag: string): Promise<string[]>;
  keysByPath(pathname: string): Promise<string[]>;
  /** Removes entries whose expire window has elapsed. Returns the count. */
  prune(now?: number): Promise<number>;
}

export default FileSystemCacheAdapter;
