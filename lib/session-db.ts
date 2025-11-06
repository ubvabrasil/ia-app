// Database adapter: use PostgreSQL when POSTGRES_HOST is provided, otherwise fallback to SQLite
// For Postgres support add `pg` to dependencies (already added to package.json).

import path from 'path';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

const usePostgres = !!process.env.POSTGRES_HOST && process.env.POSTGRES_HOST !== '';

let dbExport: { type: 'pg'; pool: Pool } | { type: 'sqlite'; db: Database.Database };

const {
  POSTGRES_HOST = process.env.POSTGRES_HOST,
  POSTGRES_PORT = '5432',
  POSTGRES_USER = 'postgres',
  POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD,
  POSTGRES_DB = process.env.POSTGRES_DB,
} = process.env;

const pool = new Pool({
  host: POSTGRES_HOST,
  port: Number(POSTGRES_PORT || 5432),
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
});

// Initialize tables asynchronously (don't block startup)
(async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          name TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          role TEXT,
          content TEXT,
          content_type TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(session_id) REFERENCES sessions(id)
        );
      `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value JSONB,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ PostgreSQL tables initialized');
    }
  } catch (err) {
    // Do not crash app during startup; log error instead
    console.error('❌ Failed to initialize Postgres session tables:', err);
  }
})();

dbExport = {
  type: 'pg' as const,
  pool,
};

export default dbExport;
