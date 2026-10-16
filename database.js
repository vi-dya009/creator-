import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

export function createDatabase(databasePath = process.env.DATABASE_PATH || './server/data/creatorflow.sqlite') {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true })
  }

  const db = new Database(databasePath)
  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL CHECK (platform IN ('YouTube', 'Instagram', 'LinkedIn', 'Other')),
      status TEXT NOT NULL CHECK (status IN ('Idea', 'Draft', 'Ready', 'Scheduled', 'Published (demo)', 'Cancelled')),
      scheduled_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      CHECK (status != 'Scheduled' OR scheduled_at IS NOT NULL)
    );

    CREATE INDEX IF NOT EXISTS idx_content_posts_user_schedule
      ON content_posts(user_id, scheduled_at);

    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
  `)
  return db
}
