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
