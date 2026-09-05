import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { cfg } from '../config.js';

const db = new Database(cfg.SQLITE_PATH);
const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
db.exec(schema);
console.log('migrations applied');
