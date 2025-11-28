import { NextResponse } from 'next/server';
import { saveSession, getAllSessionsWithMessages } from '../../../lib/session-api';

export async function POST(req: Request) {
  try {
    // Validate request has body content
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }

    const text = await req.text();
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const body = JSON.parse(text);
    const id = body.id;
    const name = body.name || `Sessão ${id}`;
    const nome_completo = body.nome_completo || null;
    const remote_jid = body.remote_jid || null;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    await saveSession({ id, name, nome_completo, remote_jid });
    return NextResponse.json({ id, name, nome_completo, remote_jid });
  } catch (err: any) {
    console.error('Error in /api/session:', err);
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
