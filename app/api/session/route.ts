import { NextResponse } from 'next/server';
import { saveSession } from '../../../lib/session-api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;
    const name = body.name || `Sessão ${id}`;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    await saveSession({ id, name });
    return NextResponse.json({ id, name });
  } catch (err: any) {
    console.error('Error in /api/session:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
