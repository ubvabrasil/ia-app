'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FiCheck, FiX, FiSend, FiSave, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';

export default function WebhookPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
    setIsChecking(false);
    loadConfig();
  }, [router]);
  
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
        setMessage('Configuração salva com sucesso!');
      } else {
        setMessageType('error');
        setMessage(data.error || 'Erro ao salvar configuração');
      }
    } catch (err: any) {
      setMessageType('error');
      setMessage(err.message);
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
          message: 'Teste de webhook - ' + new Date().toLocaleString(),
          event: 'SEND_MESSAGE',
          filebase64: null,
          sessionid: 'test-' + Date.now(),
          username: 'Sistema de Teste',
          contenttype: 'text',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessageType('success');
        setMessage(`Webhook respondeu com sucesso! Status: ${data.status}`);
      } else {
        setMessageType('error');
        setMessage(data.error || 'Erro ao enviar teste');
      }
    } catch (err: any) {
      setMessageType('error');
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-slate-600 dark:text-zinc-400">Verificando autenticação...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/dashboard')}
              className="text-slate-700 dark:text-zinc-300"
            >
              <FiArrowLeft className="mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Configuração de Webhook
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
          >
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-6 pt-24">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">
                Webhook n8n
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-zinc-400">
                Configure a URL do webhook para integração com n8n
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-zinc-300 font-medium text-sm">
                  URL do Webhook n8n
                </label>
                <Input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://n8n.ubva.com.br/webhook/..."
                  className="bg-slate-50 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                  Cole aqui a URL do seu webhook configurado no n8n
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={loading || !webhookUrl}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <FiRefreshCw className="animate-spin mr-2" />
                  ) : (
                    <FiSave className="mr-2" />
                  )}
                  Salvar Configuração
                </Button>
                <Button
                  onClick={handleTest}
                  disabled={loading || !webhookUrl}
                  variant="outline"
                  className="flex-1 border-slate-300 dark:border-zinc-700"
                >
                  {loading ? (
                    <FiRefreshCw className="animate-spin mr-2" />
                  ) : (
                    <FiSend className="mr-2" />
                  )}
                  Testar Webhook
                </Button>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    messageType === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {messageType === 'success' ? (
                    <FiCheck className="text-green-600 dark:text-green-400 text-xl flex-shrink-0 mt-0.5" />
                  ) : (
                    <FiX className="text-red-600 dark:text-red-400 text-xl flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    messageType === 'success' 
                      ? 'text-green-800 dark:text-green-300' 
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    {message}
                  </p>
                </div>
              )}

              <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700">
                <h3 className="text-slate-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                  Como configurar
                </h3>
                <ol className="text-slate-700 dark:text-zinc-300 text-sm space-y-2 list-decimal list-inside">
                  <li>Crie um workflow no n8n com um node "Webhook"</li>
                  <li>Copie a URL do webhook gerada</li>
                  <li>Cole a URL no campo acima</li>
                  <li>Clique em "Salvar Configuração"</li>
                  <li>Teste a conexão com "Testar Webhook"</li>
                </ol>
              </div>

              <div className="mt-4 p-4 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700">
                <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Formato do Payload</h3>
                <pre className="text-xs text-slate-600 dark:text-zinc-400 overflow-x-auto bg-white dark:bg-zinc-900 p-3 rounded border border-slate-200 dark:border-zinc-700">
{`{
  "message": "texto da mensagem",
  "event": "SEND_MESSAGE",
  "filebase64": null,
  "sessionid": "...",
  "username": "...",
  "whatsappnumber": "...",
  "contenttype": "text"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
