import { dbExport, pool, db } from './session-db';
import { sessions, messages, settings } from './schema';
import { eq, asc, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type MessageRecord = {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  contentType: string;
  imageUrl?: string;
  audioUrl?: string;
  audioBase64?: string;
  mimeType?: string;
  nome_completo?: string | null;
  remote_jid?: string | null;
};

export type SessionRecord = {
  id: string;
  name?: string;
  nome_completo?: string | null;
  remote_jid?: string | null;
};

// Retorna todas as sessões já com as últimas N mensagens (default: 20)
export async function getAllSessionsWithMessages(limit: number = 20): Promise<any[]> {
  const sess = await db.select().from(sessions).orderBy(desc(sessions.created_at));
  const result = await Promise.all(sess.map(async (s: any) => {
    const msgs = await db.select().from(messages)
      .where(eq(messages.session_id, s.id))
      .orderBy(desc(messages.created_at))
      .limit(limit);

    // Convert field names to previous shape
    const mapped = msgs.map((m: any) => ({
      ...m,
      imageUrl: m.image_url || undefined,
    })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return { ...s, messages: mapped };
  }));
  return result;
}

export async function saveMessage({ sessionId, role, content, contentType, imageUrl, audioUrl, audioBase64, mimeType, nome_completo, remote_jid }: MessageRecord): Promise<void> {
  const id = uuidv4();
  try {
    // Ensure session exists
    const existing = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (existing.length === 0) {
      await db.insert(sessions).values({ id: sessionId, name: `Sessão ${sessionId}` });
    }

    await db.insert(messages).values({
      id,
      session_id: sessionId,
      role,
      content,
      content_type: contentType,
      image_url: imageUrl || null,
      audio_url: audioUrl || null,
      audio_base64: audioBase64 || null,
      mime_type: mimeType || null,
    });
      image_url: imageUrl || null,
    });

    if (nome_completo || remote_jid) {
      try {
        await db.update(sessions).set({
          nome_completo: nome_completo || null,
          remote_jid: remote_jid || null,
        }).where(eq(sessions.id, sessionId));
      } catch (err) {
        console.error('Error updating session with nome_completo/remote_jid:', err);
      }
    }
  } catch (err) {
    console.error('Error saving message via Drizzle:', err);
    throw err;
  }
}

export async function saveSession({ id, name, nome_completo, remote_jid }: SessionRecord): Promise<void> {
  try {
    const existing = await db.select().from(sessions).where(eq(sessions.id, id));
    if (existing.length === 0) {
      await db.insert(sessions).values({ id, name: name || null, nome_completo: nome_completo || null, remote_jid: remote_jid || null });
    } else {
      await db.update(sessions).set({
        name: name || existing[0].name,
        nome_completo: nome_completo || existing[0].nome_completo,
        remote_jid: remote_jid || existing[0].remote_jid,
      }).where(eq(sessions.id, id));
    }
  } catch (err) {
    console.error('Error saving session via Drizzle:', err);
    throw err;
  }
}

export async function getMessagesBySession(sessionId: string): Promise<any[]> {
  const res = await db.select().from(messages).where(eq(messages.session_id, sessionId)).orderBy(asc(messages.created_at));
  return res.map((m: any) => ({ ...m, imageUrl: m.image_url || undefined }));
}

export async function getAllSessions(): Promise<any[]> {
  return await db.select().from(sessions).orderBy(desc(sessions.created_at));
}

// Config persistence (store settings like webhookUrl, authToken, chatName)
export async function saveConfig(key: string, value: any): Promise<void> {
  try {
    const existing = await db.select().from(settings).where(eq(settings.key, key));
    if (existing.length === 0) {
      await db.insert(settings).values({ key, value });
    } else {
      await db.update(settings).set({ value }).where(eq(settings.key, key));
    }
  } catch (err) {
    console.error('Error saving config via Drizzle:', err);
    throw err;
  }
}

export async function getConfig(key: string): Promise<any | null> {
  const res = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (res.length === 0) return null;
  return res[0].value;
}
