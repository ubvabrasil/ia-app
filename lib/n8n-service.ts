export type N8nConfigPartial = {
  webhookUrl?: string;
  authToken?: string | null;
  chatName?: string;
  sessionId?: string;
};

export class N8nService {
  config: N8nConfigPartial;

  constructor(config: N8nConfigPartial = {}) {
    this.config = config;
  }

  private resolveUrl(): string | null {
    return this.config.webhookUrl || null;
  }

  async sendMessage(message: string): Promise<any> {
    const url = this.resolveUrl();
    if (!url) return { error: 'No webhookUrl configured' };
    try {
      const body = {
        message,
        session_id: this.config.sessionId || null,
      };
      // If running in browser, call server-side proxy to avoid CORS
      if (typeof window !== 'undefined') {
        const prox = await fetch('/api/n8n-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl: url, ...body }),
        });
        return await prox.json().catch(() => ({ status: prox.status }));
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json().catch(() => ({ status: res.status }));
    } catch (err: any) {
      return { error: String(err) };
    }
  }

  async sendFile(file: File | Blob, message?: string): Promise<any> {
    const url = this.resolveUrl();
    if (!url) return { error: 'No webhookUrl configured' };
    try {
      // Prefer multipart/form-data (n8n can accept file uploads)
      const form = new FormData();
      // If File provided, append directly; if Blob, wrap as File
      if ((file as File).name) {
        form.append('file', file as File, (file as File).name);
      } else {
        form.append('file', new Blob([file]), 'file');
      }
      if (message) form.append('message', message);
      if (this.config.sessionId) form.append('session_id', this.config.sessionId);

      // If running in browser, use server-side proxy (send file as base64)
      if (typeof window !== 'undefined') {
        const arrayBuffer = await (file as Blob).arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const prox = await fetch('/api/n8n-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl: url, fileBase64: base64, fileName: (file as File).name || 'file', fileType: (file as File).type || 'application/octet-stream', message, session_id: this.config.sessionId || null }),
        });
        try {
          return await prox.json();
        } catch {
          const text = await prox.text();
          return { text };
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        body: form,
      });
      // Try to parse JSON, but return text fallback
      try {
        return await res.json();
      } catch {
        const text = await res.text();
        return { text };
      }
    } catch (err: any) {
      return { error: String(err) };
    }
  }
}

export default N8nService;
