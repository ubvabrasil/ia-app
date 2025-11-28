"use client";
import { useState, useEffect } from 'react';
import { FaBroom } from 'react-icons/fa';

const EVENTS = [
  'APPLICATION_STARTUP',
  'CHATS_DELETE',
  'CHATS_SET',
  'CHATS_UPDATE',
  'CHATS_UPSERT',
  'CONNECTION_UPDATE',
  'CONTACTS_SET',
  'CONTACTS_UPDATE',
  'CONTACTS_UPSERT',
  'LABELS_ASSOCIATION',
  'LABELS_EDIT',
  'LOGOUT_INSTANCE',
  'MESSAGES_DELETE',
  'MESSAGES_SET',
  'MESSAGES_UPDATE',
  'MESSAGES_UPSERT',
  'PRESENCE_UPDATE',
  'QRCODE_UPDATED',
  'REMOVE_INSTANCE',
  'SEND_MESSAGE',
  'TYPEBOT_CHANGE_STATUS',
  'TYPEBOT_START',
];

export default function WebhookPanel() {
  // Carregar dados salvos ao abrir
  useEffect(() => {
    fetch('/api/webhook-config')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(config => {
        if (config?.webhook) {
          setWebhookEnabled(!!config.webhook.enabled);
          setBaseUrl(config.webhook.baseUrl || '');
          setWebhookBase64(!!config.webhook.webhookBase64);
          setWebhookByEvents(!!config.webhook.webhookByEvents);
          if (Array.isArray(config.webhook.events)) {
            setWebhookEventStates(Object.fromEntries(EVENTS.map(e => [e, config.webhook.events.includes(e)])));
          }
        }
        if (config?.websocket) {
          setWsEnabled(!!config.websocket.enabled);
          if (Array.isArray(config.websocket.events)) {
            setWsEventStates(Object.fromEntries(EVENTS.map(e => [e, config.websocket.events.includes(e)])));
          }
        }
      });
  }, []);
  const [activeTab, setActiveTab] = useState<'webhook' | 'websocket' | 'n8n'>('webhook');
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const [webhookBase64, setWebhookBase64] = useState(false);
  const [webhookByEvents, setWebhookByEvents] = useState(true);
  const [webhookEventStates, setWebhookEventStates] = useState(() => Object.fromEntries(EVENTS.map(e => [e, false])));

  // WebSocket integration
  const [wsEnabled, setWsEnabled] = useState(false);
  const [wsEventStates, setWsEventStates] = useState(() => Object.fromEntries(EVENTS.map(e => [e, false])));

  const markAllWebhook = () => setWebhookEventStates(Object.fromEntries(EVENTS.map(e => [e, true])));
  const unmarkAllWebhook = () => setWebhookEventStates(Object.fromEntries(EVENTS.map(e => [e, false])));
  const markAllWs = () => setWsEventStates(Object.fromEntries(EVENTS.map(e => [e, true])));
  const unmarkAllWs = () => setWsEventStates(Object.fromEntries(EVENTS.map(e => [e, false])));

  const handleWebhookEventChange = (event: string) => {
    setWebhookEventStates(prev => ({ ...prev, [event]: !prev[event] }));
  };
  const handleWsEventChange = (event: string) => {
    setWsEventStates(prev => ({ ...prev, [event]: !prev[event] }));
  };

  const markAll = () => setWsEventStates(Object.fromEntries(EVENTS.map(e => [e, true])));
  const unmarkAll = () => setWsEventStates(Object.fromEntries(EVENTS.map(e => [e, false])));

  const handleEventChange = (event: string) => {
  setWsEventStates((prev: Record<string, boolean>) => ({ ...prev, [event]: !prev[event] }));
  };

  const handleSave = () => {
    fetch('/api/webhook-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhook: {
          enabled: webhookEnabled,
          baseUrl,
          webhookBase64,
          webhookByEvents,
          events: Object.keys(webhookEventStates).filter(e => webhookEventStates[e])
        },
        websocket: {
          enabled: wsEnabled,
          events: Object.keys(wsEventStates).filter(e => wsEventStates[e])
        }
      })
    })
      .then(res => res.json())
      .then(() => alert('Configuração salva!'));
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-card rounded-lg shadow-lg border border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Integrações</h2>
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${
            activeTab === 'webhook' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
          onClick={() => setActiveTab('webhook')}
        >
          Webhook
        </button>
        <button
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${
            activeTab === 'websocket' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
          onClick={() => setActiveTab('websocket')}
        >
          WebSocket
        </button>
        <button
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${
            activeTab === 'n8n' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
          onClick={() => setActiveTab('n8n')}
        >
          n8n
        </button>
      </div>
      {activeTab === 'webhook' && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Webhook</h3>
          <div className="mb-4 flex items-center gap-4">
            <label className="font-semibold text-foreground">Enabled</label>
            <input type="checkbox" checked={webhookEnabled} onChange={e => setWebhookEnabled(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Enable or disable the webhook</span>
          </div>
          <div className="mb-4">
            <label className="font-semibold block mb-1 text-foreground">Webhook Base URL</label>
            <input
              type="text"
              className="border border-border rounded px-3 py-2 w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://yourdomain.com/webhook"
            />
            <span className="text-xs text-muted-foreground">Create a route for each event by adding the event name to the end of the URL</span>
          </div>
          <div className="mb-4 flex items-center gap-4">
            <label className="font-semibold text-foreground">Webhook Base64</label>
            <input type="checkbox" checked={webhookBase64} onChange={e => setWebhookBase64(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Send media base64 data in webhook</span>
          </div>
          <div className="mb-4 flex items-center gap-4">
            <label className="font-semibold text-foreground">Webhook by Events</label>
            <input type="checkbox" checked={webhookByEvents} onChange={e => setWebhookByEvents(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Enable or disable sending webhook by events</span>
          </div>
          <div className="mb-4 flex gap-2">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors" onClick={markAllWebhook}>Mark All</button>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors" onClick={unmarkAllWebhook}>Unmark All</button>
          </div>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EVENTS.map(event => (
              <label key={event} className="flex items-center gap-2 border border-border rounded px-2 py-1 bg-background text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookEventStates[event]}
                  onChange={() => handleWebhookEventChange(event)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <span className="text-sm font-mono">{event}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'websocket' && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">WebSocket</h3>
          <div className="mb-4 flex items-center gap-4">
            <label className="font-semibold text-foreground">Enabled</label>
            <input type="checkbox" checked={wsEnabled} onChange={e => setWsEnabled(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Enable or disable the websocket</span>
          </div>
          <div className="mb-4 flex gap-2">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors" onClick={markAllWs}>Mark All</button>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors" onClick={unmarkAllWs}>Unmark All</button>
          </div>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EVENTS.map(event => (
              <label key={event} className="flex items-center gap-2 border border-border rounded px-2 py-1 bg-background text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={wsEventStates[event]}
                  onChange={() => handleWsEventChange(event)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <span className="text-sm font-mono">{event}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'n8n' && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Integração n8n</h3>
          <div className="mb-4 flex items-center gap-4">
            <label className="font-semibold text-foreground">Enabled</label>
            <input type="checkbox" checked={webhookEnabled} onChange={e => setWebhookEnabled(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Enable or disable n8n integration</span>
          </div>
          <div className="mb-4">
            <label className="font-semibold block mb-1 text-foreground">n8n Webhook Base URL</label>
            <input
              type="text"
              className="border border-border rounded px-3 py-2 w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://yourdomain.com/webhook"
            />
            <span className="text-xs text-muted-foreground">Use a URL do webhook configurada no n8n</span>
          </div>
          <div className="mb-4 flex items-center gap-4">
            <label className="font-semibold text-foreground">Webhook Base64</label>
            <input type="checkbox" checked={webhookBase64} onChange={e => setWebhookBase64(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Enviar mídia como base64 para o n8n</span>
          </div>
          <div className="mb-4 flex items-center gap-4">
            <label className="font-semibold text-foreground">Webhook by Events</label>
            <input type="checkbox" checked={webhookByEvents} onChange={e => setWebhookByEvents(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Habilitar envio por eventos</span>
          </div>
          <div className="mb-4 flex gap-2">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors" onClick={markAllWebhook}>Mark All</button>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors" onClick={unmarkAllWebhook}>Unmark All</button>
          </div>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EVENTS.map(event => (
              <label key={event} className="flex items-center gap-2 border border-border rounded px-2 py-1 bg-background text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookEventStates[event]}
                  onChange={() => handleWebhookEventChange(event)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <span className="text-sm font-mono">{event}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {/* Fim das abas, botão Save e fechamento do container */}
      <button
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold w-full mt-4 hover:bg-primary/90 transition-colors"
        onClick={handleSave}
      >
        Save
      </button>
    </div>
  );
}
