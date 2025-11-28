import { NextRequest } from 'next/server';
import { getLastConfig } from '../webhook-config/pg';
import { pool } from '../../../lib/session-db';

export async function POST(req: NextRequest) {
  // Recebe evento e payload do frontend
  const { event, ...payload } = await req.json();
  const config = await getLastConfig();
  const webhook = config?.webhook || config;
  if (!webhook?.enabled || !webhook?.baseUrl) {
    return Response.json({ success: false, error: 'Webhook desabilitado ou URL não configurada' }, { status: 400 });
  }
  if (webhook.webhookByEvents && webhook.events && !webhook.events.includes(event)) {
    return Response.json({ success: false, error: 'Evento não permitido' }, { status: 403 });
  }
  let url = webhook.baseUrl;
  if (webhook.webhookByEvents) url += `/${event}`;
  if (webhook.webhookBase64 && payload.media) {
    payload.media = Buffer.from(payload.media).toString('base64');
  }

  // Enriquecer payload com nome/telefone a partir da sessão quando disponível
  try {
    const sessionId = payload?.session_id || payload?.sessionId || payload?.sessionId;
    if (sessionId) {
      try {
        const s = await pool.query('SELECT nome_completo, remote_jid FROM sessions WHERE id = $1 LIMIT 1', [sessionId]);
        if (s && (s.rowCount ?? 0) > 0) {
          const row = s.rows[0];
          if (!payload.nome_completo && row.nome_completo) payload.nome_completo = row.nome_completo;
          if (!payload.remote_jid && row.remote_jid) payload.remote_jid = row.remote_jid;
        }
      } catch (err) {
        console.error('Erro ao buscar sessão para enriquecer webhook-proxy:', err);
      }
    }
  } catch (err) {
    // ignore
  }

  const remoteId = payload.remote_jid || payload.whatsappNumber || undefined;
  const nome = payload.nome_completo || payload.userName || undefined;
  // Build additional context to forward to the target webhook
  const headersObj = Object.fromEntries(req.headers.entries ? req.headers.entries() : []);
  const queryObj = Object.fromEntries(new URL(req.url).searchParams.entries());
  const paramsObj: Record<string, any> = {};

  const bodyOriginal = payload?.body ?? payload ?? {};

  // Determine fileBase64: prefer explicit payload.fileBase64, otherwise use converted payload.media
  let fileBase64: string | null = null;
  if (payload?.fileBase64) fileBase64 = payload.fileBase64;
  else if (payload?.media) fileBase64 = String(payload.media);

  const messageText = payload?.message ?? payload?.Message ?? '';
  const eventValue = event ?? payload?.Event ?? null;
  const groqApi = payload?.groq_api ?? null;
  const sessionIdVal = payload?.session_id ?? payload?.sessionId ?? null;

  const forwardBody = {
    event,
    webhookUrl: url,
    headers: headersObj,
    params: paramsObj,
    query: queryObj,
    body: bodyOriginal,
    remoteId,
    nome,
    // include everything the caller sent as a convenience (but we also surface the above fields)
    payload,
    // items array as requested (1 item)
    items: [
      {
        Message: messageText,
        Event: eventValue,
        groq_api: groqApi,
        session_id: sessionIdVal,
        fileBase64,
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(forwardBody),
  });
  const result = await res.json().catch(() => ({}));
  return Response.json({ success: true, result });
}
