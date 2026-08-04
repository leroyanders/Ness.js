import type { CacheAdapter, CacheEntry } from '../index.js';

export interface SqliteCacheAdapterOptions {
  /** Defaults to `<cwd>/.ness/cache/cache.sqlite`. Use `:memory:` in tests. */
  filename?: string;
}

export class SqliteCacheAdapter implements CacheAdapter {
  constructor(database: unknown);
  /** Requires Node.js 22.5 or newer for `node:sqlite`. */
  static open(options?: SqliteCacheAdapterOptions): Promise<SqliteCacheAdapter>;
  get(key: string): Promise<CacheEntry | undefined>;
  set(key: string, entry: CacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  keysByTag(tag: string): Promise<string[]>;
  keysByPath(pathname: string): Promise<string[]>;
  close(): void;
}

export default SqliteCacheAdapter;
