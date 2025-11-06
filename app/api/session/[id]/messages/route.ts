import { NextResponse } from 'next/server';
import { getMessagesBySession } from '../../../../../lib/session-api';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    if (!sessionId) return NextResponse.json([], { status: 400 });
    const messages = await getMessagesBySession(sessionId);
    return NextResponse.json(messages);
  } catch (err: any) {
    console.error('Error in GET /api/session/[id]/messages:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
