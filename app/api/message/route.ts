import { NextResponse } from 'next/server';
import { saveMessage, getMessagesBySession } from '../../../lib/session-api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Log incoming payload for debugging persistence
    console.log('POST /api/message payload:', JSON.stringify(body));
    const { sessionId, role, content, contentType, imageUrl, audioUrl, audioBase64, mimeType, nome_completo, remote_jid } = body;
    if (!sessionId || !role || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    await saveMessage({ sessionId, role, content, contentType: contentType || 'text', imageUrl, audioUrl, audioBase64, mimeType, nome_completo: nome_completo || null, remote_jid: remote_jid || null });
    // After saving, attempt to read back the latest message(s) to log created_at and DB state
    try {
      const messages = await getMessagesBySession(sessionId);
      if (Array.isArray(messages) && messages.length > 0) {
        const last = messages[messages.length - 1];
        console.log(`Saved message for session ${sessionId}:`, last);
      } else {
        console.log(`No messages found after save for session ${sessionId}`);
      }
    } catch (readErr) {
      console.error('Error reading messages after save for logging:', readErr);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in /api/message:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
