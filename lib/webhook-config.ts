export async function getWebhookConfig() {
  const res = await fetch('/api/webhook/config');
  if (!res.ok) return null;
  return await res.json();
}

export async function sendWebhook(payload: any) {
  try {
    const res = await fetch('/api/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const resp = await res.json();

    console.log("resposta-webhook.json", JSON.stringify(resp, null, 4));

    return resp;
  } catch (err) {
    console.error('Erro ao enviar webhook:', err);
    return { success: false, error: String(err) };
  }
}
