import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  decodeEntry,
  decodeName,
  encodeEntry,
  encodeName,
  matchesPath,
} from './serialize.js';

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function readDirectory(directory) {
  try {
    return await fs.readdir(directory);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function readFile(filename) {
  try {
    return await fs.readFile(filename, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function remove(target) {
  await fs.rm(target, { force: true, recursive: true });
}

/**
 * Persists cache entries as files so a restart, a second worker, or a sidecar
 * process all observe the same cache. Tag and path membership are stored as
 * marker files, which keeps `revalidateTag` a directory read instead of a scan
 * over every entry.
 */
class FileSystemCacheAdapter {
  constructor({ directory = path.join(process.cwd(), '.ness', 'cache') } = {}) {
    this.directory = path.resolve(directory);
    this.entriesDirectory = path.join(this.directory, 'entries');
    this.tagsDirectory = path.join(this.directory, 'tags');
    this.pathsDirectory = path.join(this.directory, 'paths');
  }

  #entryFile(key) {
    return path.join(this.entriesDirectory, `${digest(key)}.json`);
  }

  async get(key) {
    return decodeEntry(await readFile(this.#entryFile(key)));
  }

  async set(key, entry) {
    await this.#unindex(key);
    await fs.mkdir(this.entriesDirectory, { recursive: true });
    const filename = this.#entryFile(key);
    const temporary = `${filename}.${process.pid}.tmp`;
    await fs.writeFile(temporary, encodeEntry(key, entry));
    await fs.rename(temporary, filename);
    await Promise.all([
      ...(entry.tags || []).map(tag =>
        this.#mark(this.tagsDirectory, tag, key),
      ),
      ...(entry.path ? [this.#mark(this.pathsDirectory, entry.path, key)] : []),
    ]);
  }

  async delete(key) {
    await this.#unindex(key);
    await remove(this.#entryFile(key));
  }

  async keys() {
    const files = await readDirectory(this.entriesDirectory);
    const keys = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const source = await readFile(path.join(this.entriesDirectory, file));
          if (!source) return undefined;
          return JSON.parse(source).key;
        }),
    );
    return keys.filter(Boolean);
  }

  async clear() {
    await remove(this.directory);
  }

  async keysByTag(tag) {
    return this.#members(path.join(this.tagsDirectory, encodeName(tag)));
  }

  async keysByPath(pathname) {
    const directories = await readDirectory(this.pathsDirectory);
    const matched = await Promise.all(
      directories
        .filter(name => matchesPath(decodeName(name), pathname))
        .map(name => this.#members(path.join(this.pathsDirectory, name))),
    );
    return matched.flat();
  }

  /** Drops entries whose `expire` window has already elapsed. */
  async prune(now = Date.now()) {
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

  async #mark(root, value, key) {
    const directory = path.join(root, encodeName(value));
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, digest(key)), key);
  }

  async #members(directory) {
    const files = await readDirectory(directory);
    const keys = await Promise.all(
      files.map(file => readFile(path.join(directory, file))),
    );
    return keys.filter(Boolean);
  }

  async #unindex(key) {
    const previous = await this.get(key);
    if (!previous) return;
    const marker = digest(key);
    await Promise.all([
      ...(previous.tags || []).map(tag =>
        remove(path.join(this.tagsDirectory, encodeName(tag), marker)),
      ),
      ...(previous.path
        ? [
            remove(
              path.join(this.pathsDirectory, encodeName(previous.path), marker),
            ),
          ]
        : []),
    ]);
  }
}

export { FileSystemCacheAdapter };
export default FileSystemCacheAdapter;
