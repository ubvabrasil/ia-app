import { NextResponse } from 'next/server';
import { saveConfig, getConfig } from '@/lib/session-api';

export async function GET() {
  try {
    const cfg = await getConfig('n8n-config');
    return NextResponse.json({ ok: true, config: cfg || null });
  } catch (err) {
    console.error('GET /api/config error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to read config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await saveConfig('n8n-config', body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/config error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to save config' }, { status: 500 });
  }
}
