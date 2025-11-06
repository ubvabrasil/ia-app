import { NextResponse } from 'next/server';
import { saveMessage } from '../../../lib/session-api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, role, content, contentType } = body;
    if (!sessionId || !role || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    await saveMessage({ sessionId, role, content, contentType: contentType || 'text' });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in /api/message:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
