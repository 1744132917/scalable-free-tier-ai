import Database from 'better-sqlite3';

type CacheRecord = {
  key: string;
  value: string;
  expiresAt: number;
};

export class SqliteEdgeCache {
  private readonly db: Database.Database;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS edge_cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);
  }

  get(key: string): string | null {
    const row = this.db
      .prepare('SELECT key, value, expires_at as expiresAt FROM edge_cache WHERE key = ?')
      .get(key) as CacheRecord | undefined;
    if (!row) return null;
    if (row.expiresAt <= Date.now()) {
      this.invalidate(key);
      return null;
    }
    return row.value;
  }

  set(key: string, value: string, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.db
      .prepare('INSERT OR REPLACE INTO edge_cache (key, value, expires_at) VALUES (?, ?, ?)')
      .run(key, value, expiresAt);
  }

  invalidate(key: string): void {
    this.db.prepare('DELETE FROM edge_cache WHERE key = ?').run(key);
  }

  invalidateTenant(tenantId: string): void {
    this.db.prepare('DELETE FROM edge_cache WHERE key LIKE ?').run(`${tenantId}:%`);
  }
}
