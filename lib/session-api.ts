// Session API: supports both SQLite (default) and PostgreSQL when configured via env vars
import db from './session-db';
import { v4 as uuidv4 } from 'uuid';

export type MessageRecord = {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  contentType: string;
};

export type SessionRecord = {
  id: string;
  name: string;
};

export async function saveMessage({ sessionId, role, content, contentType }: MessageRecord): Promise<void> {
  const id = uuidv4();
  if (db.type === 'pg') {
    // Ensure session exists to satisfy foreign key constraint
    try {
      await db.pool.query(`INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [sessionId, `Sessão ${sessionId}`]);
      await db.pool.query(
        `INSERT INTO messages (id, session_id, role, content, content_type) VALUES ($1, $2, $3, $4, $5)`,
        [id, sessionId, role, content, contentType]
      );
    } catch (err) {
      // Re-throw so route handlers can log properly
      console.error('Error saving message to Postgres:', err);
      throw err;
    }
  } else {
    try {
      // Ensure session exists in SQLite as well
      db.db.prepare(`INSERT OR IGNORE INTO sessions (id, name) VALUES (?, ?)`).run(sessionId, `Sessão ${sessionId}`);
      db.db.prepare(`INSERT INTO messages (id, session_id, role, content, content_type) VALUES (?, ?, ?, ?, ?)`).run(id, sessionId, role, content, contentType);
    } catch (err) {
      console.error('Error saving message to SQLite:', err);
      throw err;
    }
  }
}

export async function saveSession({ id, name }: SessionRecord): Promise<void> {
  if (db.type === 'pg') {
    await db.pool.query(`INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [id, name]);
  } else {
    db.db.prepare(`INSERT OR IGNORE INTO sessions (id, name) VALUES (?, ?)`).run(id, name);
  }
}

export async function getMessagesBySession(sessionId: string): Promise<any[]> {
  if (db.type === 'pg') {
    const res = await db.pool.query(`SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC`, [sessionId]);
    return res.rows;
  }
  return db.db.prepare(`SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC`).all(sessionId);
}

export async function getAllSessions(): Promise<any[]> {
  if (db.type === 'pg') {
    const res = await db.pool.query(`SELECT * FROM sessions ORDER BY created_at DESC`);
    return res.rows;
  }
  return db.db.prepare(`SELECT * FROM sessions ORDER BY created_at DESC`).all();
}

// Config persistence (store settings like webhookUrl, authToken, chatName)
export async function saveConfig(key: string, value: any): Promise<void> {
  if (db.type === 'pg') {
    await db.pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, value]
    );
  } else {
    // ensure table exists in sqlite
    try {
      db.db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`).run();
      db.db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`).run(key, JSON.stringify(value));
    } catch (err) {
      console.error('Error saving config to SQLite:', err);
      throw err;
    }
  }
}

export async function getConfig(key: string): Promise<any | null> {
  if (db.type === 'pg') {
    const res = await db.pool.query(`SELECT value FROM settings WHERE key = $1 LIMIT 1`, [key]);
    if (res.rowCount === 0) return null;
    return res.rows[0].value;
  }
  try {
    db.db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`).run();
    const row = db.db.prepare(`SELECT value FROM settings WHERE key = ? LIMIT 1`).get(key);
    if (!row) return null;
    return JSON.parse(row.value);
  } catch (err) {
    console.error('Error reading config from SQLite:', err);
    throw err;
  }
}
