import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { CacheAdapter, CacheEntry } from '../index.js';
import {
  decodeEntry,
  decodeName,
  encodeEntry,
  encodeName,
  matchesPath,
} from './serialize.js';

export interface FileSystemCacheAdapterOptions {
  /** Defaults to `<cwd>/.ness/cache`. */
  directory?: string;
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function errorCode(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException | null)?.code;
}

async function readDirectory(directory: string): Promise<string[]> {
  try {
    return await fs.readdir(directory);
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return [];
    throw error;
  }
}

async function readFile(filename: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filename, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return undefined;
    throw error;
  }
}

async function remove(target: string): Promise<void> {
  await fs.rm(target, { force: true, recursive: true });
}

/**
 * Persists cache entries as files so a restart, a second worker, or a sidecar
 * process all observe the same cache. Tag and path membership are stored as
 * marker files, which keeps `revalidateTag` a directory read instead of a scan
 * over every entry.
 */
class FileSystemCacheAdapter implements CacheAdapter {
  readonly directory: string;
  readonly entriesDirectory: string;
  readonly tagsDirectory: string;
  readonly pathsDirectory: string;

  constructor({
    directory = path.join(process.cwd(), '.ness', 'cache'),
  }: FileSystemCacheAdapterOptions = {}) {
    this.directory = path.resolve(directory);
    this.entriesDirectory = path.join(this.directory, 'entries');
    this.tagsDirectory = path.join(this.directory, 'tags');
    this.pathsDirectory = path.join(this.directory, 'paths');
  }

  #entryFile(key: string): string {
    return path.join(this.entriesDirectory, `${digest(key)}.json`);
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    return decodeEntry(await readFile(this.#entryFile(key)));
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    await this.#unindex(key);
    await fs.mkdir(this.entriesDirectory, { recursive: true });
    const filename = this.#entryFile(key);
    // Unique per call, not per process: two concurrent writes of the same key
    // — an ordinary cache stampede after an invalidation — would otherwise
    // share one temp path, and the second rename would fail with ENOENT after
    // the first consumed it. Worker threads share a pid, so that is not enough
    // to disambiguate either.
    const temporary = `${filename}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, encodeEntry(key, entry));
      await fs.rename(temporary, filename);
    } finally {
      // A failed rename must not leave the temp file behind.
      await fs.rm(temporary, { force: true }).catch(() => {});
    }
    await Promise.all([
      ...(entry.tags || []).map(tag =>
        this.#mark(this.tagsDirectory, tag, key),
      ),
      ...(entry.path
        ? [await this.#mark(this.pathsDirectory, entry.path, key)]
        : []),
    ]);
  }

  async delete(key: string): Promise<void> {
    await this.#unindex(key);
    await remove(this.#entryFile(key));
  }

  async keys(): Promise<string[]> {
    const files = await readDirectory(this.entriesDirectory);
    const keys = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const source = await readFile(path.join(this.entriesDirectory, file));
          if (!source) return undefined;
          return (JSON.parse(source) as { key?: string }).key;
        }),
    );
    return keys.filter((key): key is string => Boolean(key));
  }

  async clear(): Promise<void> {
    await remove(this.directory);
  }

  async keysByTag(tag: string): Promise<string[]> {
    return this.#members(path.join(this.tagsDirectory, encodeName(tag)));
  }

  async keysByPath(pathname: string): Promise<string[]> {
    const directories = await readDirectory(this.pathsDirectory);
    const matched = await Promise.all(
      directories
        .filter(name => matchesPath(decodeName(name), pathname))
        .map(name => this.#members(path.join(this.pathsDirectory, name))),
    );
    return matched.flat();
  }

  /** Drops entries whose `expire` window has already elapsed. */
  async prune(now: number = Date.now()): Promise<number> {
    let removed = 0;
    for (const key of await this.keys()) {
      const entry = await this.get(key);
      if (!entry) continue;
      const age = (now - entry.createdAt) / 1000;
      if (age < entry.life.expire) continue;
      await this.delete(key);
      removed += 1;
    }
    return removed;
  }

  async #mark(root: string, value: string, key: string): Promise<void> {
    const directory = path.join(root, encodeName(value));
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, digest(key)), key);
  }

  async #members(directory: string): Promise<string[]> {
    const files = await readDirectory(directory);
    const keys = await Promise.all(
      files.map(file => readFile(path.join(directory, file))),
    );
    return keys.filter((key): key is string => Boolean(key));
  }

  async #unindex(key: string): Promise<void> {
    const previous = await this.get(key);
    if (!previous) return;
    const marker = digest(key);
    await Promise.all([
      ...(previous.tags || []).map(tag =>
        remove(path.join(this.tagsDirectory, encodeName(tag), marker)),
      ),
      ...(previous.path
        ? [
            await remove(
              path.join(this.pathsDirectory, encodeName(previous.path), marker),
            ),
          ]
        : []),
    ]);
  }
}

export { FileSystemCacheAdapter };
export default FileSystemCacheAdapter;
