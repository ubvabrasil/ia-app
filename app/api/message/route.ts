import { NextResponse } from 'next/server';
import { saveMessage, getMessagesBySession, updateMessage, deleteMessage } from '../../../lib/session-api';

// GET: listar mensagens de uma sessão (query param ?sessionId=...)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId é obrigatório' }, { status: 400 });
    }
    
    const messages = await getMessagesBySession(sessionId);
    return NextResponse.json(messages || []);
  } catch (err: any) {
    console.error('Error in GET /api/message:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Log incoming payload for debugging persistence
    console.log('POST /api/message payload:', JSON.stringify(body));
    const { sessionId, role, content, contentType, imageUrl, audioUrl, audioBase64, mimeType, nome_completo, remote_jid } = body;
    
    if (!sessionId || !role || !content) {
      return NextResponse.json({ 
        success: false,
        error: 'Campos obrigatórios: sessionId, role, content' 
      }, { status: 400 });
    }
    
    await saveMessage({ 
      sessionId, 
      role, 
      content, 
      contentType: contentType || 'text', 
      imageUrl, 
      audioUrl, 
      audioBase64, 
      mimeType, 
      nome_completo: nome_completo || null, 
      remote_jid: remote_jid || null 
    });
    
    // After saving, attempt to read back the latest message(s) to log created_at and DB state
    let savedMessage = null;
    try {
      const messages = await getMessagesBySession(sessionId);
      if (Array.isArray(messages) && messages.length > 0) {
        savedMessage = messages[messages.length - 1];
        console.log(`Saved message for session ${sessionId}:`, savedMessage);
      } else {
        console.log(`No messages found after save for session ${sessionId}`);
      }
    } catch (readErr) {
      console.error('Error reading messages after save for logging:', readErr);
    }
    
    return NextResponse.json({ 
      success: true,
      message: savedMessage || { sessionId, role, content, contentType: contentType || 'text' }
    });
  } catch (err: any) {
    console.error('Error in /api/message:', err);
    return NextResponse.json({ 
      success: false,
      error: err?.message || String(err) 
    }, { status: 500 });
  }
}

// PATCH: atualizar parcialmente uma mensagem existente
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'Missing message id' }, { status: 400 });
    // Patch fields allowed: content, contentType, imageUrl, audioUrl, audioBase64, mimeType
    await updateMessage(id, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in PATCH /api/message:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// DELETE: deletar uma mensagem por id
export async function DELETE(req: Request) {
  try {
    // tentar ler id do query string primeiro
    let id: string | null = null;
    try {
      const url = new URL(req.url);
      id = url.searchParams.get('id');
    } catch {}

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id || null;
    }

    if (!id) return NextResponse.json({ error: 'Missing message id' }, { status: 400 });
    await deleteMessage(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/message:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
