import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  name: text('name'),
  nome_completo: text('nome_completo'),
  remote_jid: text('remote_jid'),
  created_at: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  session_id: text('session_id'),
  role: text('role'),
  content: text('content'),
  content_type: text('content_type'),
  image_url: text('image_url'),
  audio_url: text('audio_url'),
  audio_base64: text('audio_base64'),
  mime_type: text('mime_type'),
  created_at: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value'),
  updated_at: timestamp('updated_at').defaultNow(),
});
