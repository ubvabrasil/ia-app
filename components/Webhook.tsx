'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiSend, FiSave, FiRefreshCw } from 'react-icons/fi';

export default function Webhook() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Configuração de Webhook
          </CardTitle>
          <CardDescription className="text-white/70">
            Configure a URL do webhook para integração com n8n
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="block text-white font-medium text-sm">
              URL do Webhook n8n
            </label>
            <Input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://n8n.ubva.com.br/webhook/..."
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/50 transition-all"
              disabled={loading}
            />
            <p className="text-xs text-white/60 mt-1">
              Cole aqui a URL do seu webhook configurado no n8n
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={loading || !webhookUrl}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 text-white hover:bg-purple-500/30 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-lg flex items-start gap-3 ${
                messageType === 'success'
                  ? 'bg-green-500/20 border border-green-500/50'
                  : 'bg-red-500/20 border border-red-500/50'
              }`}
            >
              {messageType === 'success' ? (
                <FiCheck className="text-green-400 text-xl flex-shrink-0 mt-0.5" />
              ) : (
                <FiX className="text-red-400 text-xl flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                messageType === 'success' ? 'text-green-100' : 'text-red-100'
              }`}>
                {message}
              </p>
            </motion.div>
          )}

          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-400">ℹ️</span>
              Como configurar
            </h3>
            <ol className="text-white/80 text-sm space-y-2 list-decimal list-inside">
              <li>Crie um workflow no n8n com um node "Webhook"</li>
              <li>Copie a URL do webhook gerada</li>
              <li>Cole a URL no campo acima</li>
              <li>Clique em "Salvar Configuração"</li>
              <li>Teste a conexão com "Testar Webhook"</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/30">
            <h3 className="text-white font-semibold mb-2">Formato do Payload</h3>
            <pre className="text-xs text-white/70 overflow-x-auto">
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
    </motion.div>
  );
}
