import { NextResponse } from 'next/server';
import { getSessionsSummary } from '@/lib/session-api';

// GET: retorna resumo de todas as sessões (sem mensagens completas)
export async function GET() {
  try {
    const summary = await getSessionsSummary();
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Error in GET /api/session/summary:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
