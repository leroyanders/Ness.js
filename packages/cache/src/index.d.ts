export interface CacheLife {
  stale?: number;
  revalidate?: number;
  expire?: number;
}

export interface CacheEntry<T = unknown> {
  value: T;
  createdAt: number;
  life: Required<CacheLife>;
  tags: string[];
  path?: string;
}

export interface CacheAdapter {
  get(key: string): Promise<CacheEntry | undefined> | CacheEntry | undefined;
  set(key: string, entry: CacheEntry): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  keys(): Promise<string[]> | string[];
  clear(): Promise<void> | void;
  /**
   * Optional tag index. When present, `revalidateTag` resolves the affected
   * keys directly instead of scanning and reading every cached entry.
   */
  keysByTag?(tag: string): Promise<string[]> | string[];
  /** Optional path index, matching a pathname and its descendants. */
  keysByPath?(pathname: string): Promise<string[]> | string[];
}

export type CacheProfile =
  'seconds' | 'minutes' | 'hours' | 'days' | 'max' | 'default';

export interface CacheOptions<Args extends unknown[] = unknown[]> {
  key?: string;
  life?: CacheProfile | CacheLife;
  tags?: string[] | ((...args: Args) => string[]);
  path?: string | ((...args: Args) => string);
  onError?: (error: unknown) => void;
}

export class MemoryCacheAdapter implements CacheAdapter {
  constructor(options?: { clock?: () => number });
  get(key: string): Promise<CacheEntry | undefined>;
  set(key: string, entry: CacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  keysByTag(tag: string): Promise<string[]>;
  keysByPath(pathname: string): Promise<string[]>;
}

export class NessCache {
  constructor(adapter?: CacheAdapter, options?: { clock?: () => number });
  getOrSet<T>(
    key: string,
    producer: () => Promise<T> | T,
    options?: CacheOptions,
  ): Promise<T>;
  revalidateTag(tag: string): Promise<number>;
  revalidatePath(pathname: string): Promise<number>;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

export const CACHE_PROFILES: Readonly<
  Record<CacheProfile, Required<CacheLife>>
>;
export function cached<Args extends unknown[], Result>(
  producer: (...args: Args) => Promise<Result> | Result,
  options?: CacheOptions<Args>,
): (...args: Args) => Promise<Awaited<Result>>;
export function getCache(): NessCache;
export function setCache(cache: NessCache | CacheAdapter): NessCache;
export function withCache<T>(cache: NessCache, callback: () => T): T;
export function revalidateTag(tag: string): Promise<number>;
export function updateTag(tag: string): Promise<number>;
export function revalidatePath(pathname: string): Promise<number>;
