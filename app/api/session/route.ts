import { NextResponse } from 'next/server';
import { saveSession, getAllSessionsWithMessages, updateSession, deleteSession } from '../../../lib/session-api';

export async function POST(req: Request) {
  try {
    console.log('[/api/session POST] Request received');
    
    // Validate request has body content
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('[/api/session POST] Invalid content type:', contentType);
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }

    const text = await req.text();
    if (!text || text.trim() === '') {
      console.error('[/api/session POST] Empty request body');
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const body = JSON.parse(text);
    console.log('[/api/session POST] Body parsed:', body);
    
    const id = body.id;
    const name = body.name || `Sessão ${id}`;
    const nome_completo = body.nome_completo || null;
    const remote_jid = body.remote_jid || null;
    
    if (!id) {
      console.error('[/api/session POST] Missing id');
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    console.log('[/api/session POST] Saving session:', { id, name, nome_completo, remote_jid });
    await saveSession({ id, name, nome_completo, remote_jid });
    console.log('[/api/session POST] Session saved successfully');
    
    return NextResponse.json({ id, name, nome_completo, remote_jid });
  } catch (err: any) {
    console.error('[/api/session POST] Error:', err);
    console.error('[/api/session POST] Error stack:', err?.stack);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// GET: retorna todas as sessões salvas
export async function GET() {
  try {
    // Retorna sessões já com as últimas 20 mensagens
    const sessions = await getAllSessionsWithMessages(20);
    return NextResponse.json(sessions);
  } catch (err: any) {
    console.error('Error in GET /api/session:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// PUT: criar/atualizar sessão (idempotente)
export async function PUT(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const name = body.name || null;
    const nome_completo = body.nome_completo || null;
    const remote_jid = body.remote_jid || null;
    await saveSession({ id, name, nome_completo, remote_jid });
    return NextResponse.json({ success: true, id, name, nome_completo, remote_jid });
  } catch (err: any) {
    console.error('Error in PUT /api/session:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// PATCH: atualizar parcialmente a sessão
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await updateSession(id, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in PATCH /api/session:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// DELETE: deletar sessão e mensagens associadas
export async function DELETE(req: Request) {
  try {
    let id: string | null = null;
    try {
      const url = new URL(req.url);
      id = url.searchParams.get('id');
    } catch {}
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id || null;
    }
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await deleteSession(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/session:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
