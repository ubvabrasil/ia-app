// Database adapter: use PostgreSQL when POSTGRES_HOST is provided, otherwise fallback to SQLite
// For Postgres support add `pg` to dependencies (already added to package.json).

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

let dbExport: { type: 'pg'; pool: Pool };

const {
  POSTGRES_HOST = process.env.PGHOST || process.env.POSTGRES_HOST,
  POSTGRES_PORT = process.env.PGPORT || '5432',
  POSTGRES_USER = process.env.PGUSER || 'postgres',
  POSTGRES_PASSWORD = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
  POSTGRES_DB = process.env.PGDATABASE || process.env.POSTGRES_DB,
} = process.env;

const pool = new Pool({
  host: POSTGRES_HOST,
  port: Number(POSTGRES_PORT || 5432),
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
});

// Log connection info for debugging
console.log('PostgreSQL connection config:', {
  host: POSTGRES_HOST,
  port: Number(POSTGRES_PORT || 5432),
  user: POSTGRES_USER,
  database: POSTGRES_DB,
  passwordConfigured: !!POSTGRES_PASSWORD,
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

    // Ensure new columns exist (safe to run on existing DBs)
    await pool.query(`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS nome_completo TEXT,
      ADD COLUMN IF NOT EXISTS remote_jid TEXT;
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          role TEXT,
          content TEXT,
          content_type TEXT,
          image_url TEXT,
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

// Expose a Drizzle `db` instance using the same pool so application code
// can migrate gradually from raw SQL to Drizzle ORM.
export const db = drizzle(pool);

export { dbExport, pool };
