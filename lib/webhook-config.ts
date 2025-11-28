export async function getWebhookConfig() {
  const res = await fetch('/api/webhook-config');
  if (!res.ok) return null;
  return await res.json();
}

export async function sendWebhookEvent(event: string, payload: any) {
  const config = await getWebhookConfig();
  if (!config?.enabled) return;
  if (config.webhookByEvents && config.events && !config.events.includes(event)) return;
  if (!config.baseUrl) return;

  let url = config.baseUrl;
  if (config.webhookByEvents) url += `/${event}`;

  // Se for base64, incluir no payload
  if (config.webhookBase64 && payload.media) {
    payload.media = btoa(payload.media);
  }

  // Enriquecer o payload com nome e número do cliente quando disponível.
  // Prioriza campos já presentes no payload (nome_completo, remote_jid),
  // caso contrário tenta ler do localStorage (client-side).
  let remoteId: string | undefined = undefined;
  let nome: string | undefined = undefined;
  if (payload) {
    if (payload.remote_jid) remoteId = payload.remote_jid;
    if (payload.whatsappNumber) remoteId = payload.whatsappNumber;
    if (payload.nome_completo) nome = payload.nome_completo;
    if (payload.userName) nome = payload.userName;
  }

  try {
    if (!remoteId && typeof localStorage !== 'undefined') {
      remoteId = localStorage.getItem('whatsappNumber') || undefined;
    }
  } catch (e) {
    // ignore (SSR)
  }
  try {
    if (!nome && typeof localStorage !== 'undefined') {
      nome = localStorage.getItem('userName') || undefined;
    }
  } catch (e) {
    // ignore (SSR)
  }

  const body = { event, ...payload, remoteId, nome };

  await fetch('https://n8n.easydev.com.br/webhook-test/dd359405-0524-4b50-a215-e357208144d7', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
