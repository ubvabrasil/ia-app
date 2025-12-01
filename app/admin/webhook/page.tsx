'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function WebhookPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Carrega configuração ao montar
  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch('/api/webhook/config');
      const data = await res.json();
      if (data.webhookUrl) {
        setWebhookUrl(data.webhookUrl);
      }
    } catch (err) {
      console.error('Erro ao carregar config:', err);
    }
  }

  async function handleSave() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/webhook/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setMessageType('success');
        setMessage('✓ Configuração salva com sucesso');
      } else {
        setMessageType('error');
        setMessage('✗ ' + (data.error || 'Erro ao salvar'));
      }
    } catch (err: any) {
      setMessageType('error');
      setMessage('✗ ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: true,
          message: 'Teste de webhook',
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessageType('success');
        setMessage(`✓ Webhook enviado com sucesso (status ${data.status})`);
      } else {
        setMessageType('error');
        setMessage('✗ ' + (data.error || 'Erro ao enviar'));
      }
    } catch (err: any) {
      setMessageType('error');
      setMessage('✗ ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Webhook n8n</h1>
        
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                URL do Webhook n8n
              </label>
              <Input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://n8n.easydev.com.br/webhook/..."
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={loading || !webhookUrl}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {loading ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
              <Button
                onClick={handleTest}
                disabled={loading || !webhookUrl}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
              >
                {loading ? 'Testando...' : 'Testar Webhook'}
              </Button>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  messageType === 'success'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-100'
                    : 'bg-red-500/20 border border-red-500/50 text-red-100'
                }`}
              >
                {message}
              </div>
            )}

            <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-white font-medium mb-2">Como usar:</h3>
              <ol className="text-white/80 text-sm space-y-1 list-decimal list-inside">
                <li>Cole a URL do seu webhook n8n acima</li>
                <li>Clique em "Salvar Configuração"</li>
                <li>Clique em "Testar Webhook" para verificar a conexão</li>
                <li>Agora todas as mensagens serão enviadas automaticamente para o n8n</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
