import fs from 'node:fs';
import path from 'node:path';
import type { CacheAdapter, CacheEntry } from '../index.js';
import { decodeLife, encodeLife } from './serialize.js';
import type { EncodedLife } from './serialize.js';

export interface SqliteCacheAdapterOptions {
  /** Defaults to `<cwd>/.ness/cache/cache.sqlite`. Use `:memory:` in tests. */
  filename?: string;
}

/**
 * Only what this adapter calls. Structural rather than an import of
 * `node:sqlite`, so the package still type-checks on runtimes that do not
 * ship the module.
 */
interface SqliteStatement {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): unknown;
}

export interface SqliteDatabaseLike {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
}

interface EntryRow {
  key: string;
  value: string;
  created_at: number | bigint;
  stale: number;
  revalidate: number;
  expire: string;
  path: string | null;
}

type DatabaseSyncConstructor = new (filename: string) => SqliteDatabaseLike;

async function loadSqlite(): Promise<{
  DatabaseSync: DatabaseSyncConstructor;
}> {
  try {
    return (await import('node:sqlite')) as unknown as {
      DatabaseSync: DatabaseSyncConstructor;
    };
  } catch {
    throw new Error(
      'SqliteCacheAdapter requires the node:sqlite module (Node.js 22.5 or newer). ' +
        'Use FileSystemCacheAdapter on older runtimes.',
    );
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS ness_cache_entries (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  stale REAL NOT NULL,
  revalidate REAL NOT NULL,
  expire TEXT NOT NULL,
  path TEXT
);
CREATE TABLE IF NOT EXISTS ness_cache_tags (
  key TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (key, tag)
);
CREATE INDEX IF NOT EXISTS ness_cache_tags_tag ON ness_cache_tags (tag);
CREATE INDEX IF NOT EXISTS ness_cache_entries_path ON ness_cache_entries (path);
`;

/**
 * A single-file shared cache for deployments that run several processes on one
 * host (clustered Node, a container with workers) and do not want to operate
 * Redis. SQLite gives cross-process visibility and durable tag indexes with no
 * external service.
 */
class SqliteCacheAdapter implements CacheAdapter {
  database: SqliteDatabaseLike;

  constructor(database: SqliteDatabaseLike) {
    if (!database)
      throw new TypeError('SqliteCacheAdapter requires a database.');
    this.database = database;
    this.database.exec(SCHEMA);
  }

  static async open({
    filename = path.join(process.cwd(), '.ness', 'cache', 'cache.sqlite'),
  }: SqliteCacheAdapterOptions = {}): Promise<SqliteCacheAdapter> {
    const { DatabaseSync } = await loadSqlite();
    if (filename !== ':memory:') {
      fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
    }
    const database = new DatabaseSync(filename);
    database.exec('PRAGMA journal_mode = WAL;');
    return new SqliteCacheAdapter(database);
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    const row = this.database
      .prepare('SELECT * FROM ness_cache_entries WHERE key = ?')
      .get(key) as EntryRow | undefined;
    if (!row) return undefined;
    return {
      value: JSON.parse(row.value),
      createdAt: Number(row.created_at),
      life: decodeLife({
        stale: row.stale,
        revalidate: row.revalidate,
        expire: JSON.parse(row.expire),
      } as EncodedLife),
      tags: (
        this.database
          .prepare('SELECT tag FROM ness_cache_tags WHERE key = ?')
          .all(key) as Array<{ tag: string }>
      ).map(tagRow => tagRow.tag),
      path: row.path ?? undefined,
    };
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    const life = encodeLife(entry.life);
    this.database
      .prepare(
        `INSERT INTO ness_cache_entries (key, value, created_at, stale, revalidate, expire, path)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           created_at = excluded.created_at,
           stale = excluded.stale,
           revalidate = excluded.revalidate,
           expire = excluded.expire,
           path = excluded.path`,
      )
      .run(
        key,
        JSON.stringify(entry.value ?? null),
        entry.createdAt,
        life.stale,
        life.revalidate,
        JSON.stringify(life.expire),
        entry.path ?? null,
      );
    this.database.prepare('DELETE FROM ness_cache_tags WHERE key = ?').run(key);
    const insertTag = this.database.prepare(
      'INSERT OR IGNORE INTO ness_cache_tags (key, tag) VALUES (?, ?)',
    );
    for (const tag of entry.tags || []) insertTag.run(key, tag);
  }

  async delete(key: string): Promise<void> {
    this.database
      .prepare('DELETE FROM ness_cache_entries WHERE key = ?')
      .run(key);
    this.database.prepare('DELETE FROM ness_cache_tags WHERE key = ?').run(key);
  }

  async keys(): Promise<string[]> {
    return (
      this.database
        .prepare('SELECT key FROM ness_cache_entries')
        .all() as Array<{
        key: string;
      }>
    ).map(row => row.key);
  }

  async clear(): Promise<void> {
    this.database.exec(
      'DELETE FROM ness_cache_entries; DELETE FROM ness_cache_tags;',
    );
  }

  async keysByTag(tag: string): Promise<string[]> {
    return (
      this.database
        .prepare('SELECT key FROM ness_cache_tags WHERE tag = ?')
        .all(tag) as Array<{ key: string }>
    ).map(row => row.key);
  }

  async keysByPath(pathname: string): Promise<string[]> {
    // `_` and `%` are LIKE wildcards and appear in real URLs, so a path such as
    // /docs/get_started would otherwise match /docs/getXstarted. ESCAPE makes
    // the comparison literal.
    const prefix = pathname.endsWith('/') ? pathname : `${pathname}/`;
    const pattern = `${prefix.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
    return (
      this.database
        .prepare(
          "SELECT key FROM ness_cache_entries WHERE path = ? OR path LIKE ? ESCAPE '\\'",
        )
        .all(pathname, pattern) as Array<{ key: string }>
    ).map(row => row.key);
  }

  close(): void {
    this.database.close();
  }
}

export { SqliteCacheAdapter };
export default SqliteCacheAdapter;
