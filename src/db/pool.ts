import Database from 'better-sqlite3';
import { cfg } from '../config.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(cfg.SQLITE_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}
