// Modal de configurações
'use client';

import { useState } from 'react';
import { useChatStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SettingsModal() {
  const { config, updateConfigServer, clearMessages } = useChatStore();
  const [open, setOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl);
  const [authToken, setAuthToken] = useState(config.authToken || '');
  const [chatName, setChatName] = useState(config.chatName);

  const handleSave = () => {
    // update locally and persist on server
    updateConfigServer({
      webhookUrl,
      authToken: authToken || undefined,
      chatName,
    });
    setOpen(false);
  };

  const handleClearHistory = () => {
    if (confirm('Deseja realmente limpar todo o histórico de mensagens?')) {
      clearMessages();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Configurações">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border border-border shadow-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary">Configurações</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure a integração com o n8n e personalize seu chat
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Nome do Chat */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome do Chat</label>
            <Input
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="Carlos IA"
              className="bg-input text-foreground border border-border"
            />
          </div>

          {/* Webhook URL editável */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Webhook do n8n</label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://n8n.easydev.com.br/webhook-test/ia-agent-ubva"
              className="bg-input text-foreground border border-border"
            />
            <p className="text-xs text-muted-foreground">URL do webhook do n8n para processamento das mensagens</p>
          </div>

          {/* Token de autenticação */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Token de Autenticação (opcional)
            </label>
            <Input
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Bearer token..."
              type="password"
              className="bg-input text-foreground border border-border"
            />
            <p className="text-xs text-muted-foreground">
              Token de segurança se o webhook n8n exigir autenticação
            </p>
          </div>

          {/* ID da Sessão */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">ID da Sessão</label>
            <Input value={config.sessionId} disabled className="bg-muted text-muted-foreground border border-border" />
            <p className="text-xs text-muted-foreground">
              Identificador único para esta sessão de chat
            </p>
          </div>

          {/* Botão limpar histórico removido */}
        </div>

        {/* Ações */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
