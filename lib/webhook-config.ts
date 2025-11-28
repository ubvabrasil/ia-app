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
  // Delegate the actual delivery to a server-side proxy to avoid CORS issues
  // and to allow server-side enrichment (sessions, DB lookups).
  try {
    await fetch('/api/webhook-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...payload }),
    });
  } catch (err) {
    // If called server-side, fallback to direct server-side delivery using the configured URL
    // (this branch is defensive; client calls should use the proxy above)
    try {
      let url = config.baseUrl;
      if (config.webhookByEvents) url += `/${event}`;
      const body = { event, ...payload };
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err2) {
      console.error('Failed to send webhook event:', err2);
    }
  }
}
