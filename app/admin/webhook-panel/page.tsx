'use client';

import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiSave, FiRefreshCw, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

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

type TabType = 'webhook' | 'websocket' | 'n8n';

export default function WebhookPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('webhook');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Webhook state
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const [webhookBase64, setWebhookBase64] = useState(false);
  const [webhookByEvents, setWebhookByEvents] = useState(true);
  const [webhookEventStates, setWebhookEventStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(EVENTS.map(e => [e, false]))
  );

  // WebSocket state
  const [wsEnabled, setWsEnabled] = useState(true);
  const [wsEventStates, setWsEventStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(EVENTS.map(e => [e, false]))
  );

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhook-config');
      if (!res.ok) throw new Error('Failed to load config');
      const config = await res.json();
      
      const data = config?.webhook || config;
      if (data) {
        setWebhookEnabled(!!data.enabled);
        setBaseUrl(data.baseUrl || '');
        setWebhookBase64(!!data.webhookBase64);
        setWebhookByEvents(!!data.webhookByEvents);
        
        if (Array.isArray(data.events)) {
          setWebhookEventStates(
            Object.fromEntries(EVENTS.map(e => [e, data.events.includes(e)]))
          );
        }
      }
      
      const wsData = config?.websocket || {};
      if (wsData) {
        setWsEnabled(!!wsData.enabled);
        if (Array.isArray(wsData.events)) {
          setWsEventStates(
            Object.fromEntries(EVENTS.map(e => [e, wsData.events.includes(e)]))
          );
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setSaveError('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleWebhookEventChange = (event: string) => {
    setWebhookEventStates(prev => ({ ...prev, [event]: !prev[event] }));
  };

  const handleWsEventChange = (event: string) => {
    setWsEventStates(prev => ({ ...prev, [event]: !prev[event] }));
  };

  const markAllWebhook = () => setWebhookEventStates(Object.fromEntries(EVENTS.map(e => [e, true])));
  const unmarkAllWebhook = () => setWebhookEventStates(Object.fromEntries(EVENTS.map(e => [e, false])));
  const markAllWs = () => setWsEventStates(Object.fromEntries(EVENTS.map(e => [e, true])));
  const unmarkAllWs = () => setWsEventStates(Object.fromEntries(EVENTS.map(e => [e, false])));

  const handleSave = async () => {
    setSaveSuccess(false);
    setSaveError('');
    setLoading(true);

    try {
      const payload: any = {};

      if (activeTab === 'webhook' || activeTab === 'n8n') {
        payload.webhook = {
          enabled: webhookEnabled,
          baseUrl,
          webhookBase64,
          webhookByEvents,
          events: Object.keys(webhookEventStates).filter(e => webhookEventStates[e]),
        };
      }

      if (activeTab === 'websocket') {
        payload.websocket = {
          enabled: wsEnabled,
          events: Object.keys(wsEventStates).filter(e => wsEventStates[e]),
        };
      }

      const res = await fetch('/api/webhook-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setSaveError('Erro ao salvar configuração');
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'webhook' as TabType, label: 'Webhook', icon: '🔗' },
    { id: 'websocket' as TabType, label: 'WebSocket', icon: '🔌' },
    { id: 'n8n' as TabType, label: 'n8n', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Configuração de Integrações
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure webhooks, WebSocket e integração n8n para seu sistema
          </p>
        </div>

        {/* Status Messages */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <FiCheck className="text-green-600 dark:text-green-400 text-xl" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              Configuração salva com sucesso!
            </span>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <FiX className="text-red-600 dark:text-red-400 text-xl" />
            <span className="text-red-800 dark:text-red-200 font-medium">{saveError}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Webhook Tab */}
          {(activeTab === 'webhook' || activeTab === 'n8n') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeTab === 'n8n' ? 'Integração n8n' : 'Webhook'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activeTab === 'n8n' 
                      ? 'Configure a URL do webhook do seu workflow n8n'
                      : 'Configure webhooks para receber eventos do sistema'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setWebhookEnabled(!webhookEnabled)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {webhookEnabled ? (
                    <FiToggleRight className="text-2xl text-green-600 dark:text-green-400" />
                  ) : (
                    <FiToggleLeft className="text-2xl text-gray-400" />
                  )}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {webhookEnabled ? 'Ativo' : 'Inativo'}
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  URL do Webhook {activeTab === 'n8n' && '(n8n)'}
                </label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://seu-servidor.com/webhook"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {webhookByEvents 
                    ? 'O evento será adicionado ao final da URL (ex: /SEND_MESSAGE)'
                    : 'URL base para todos os eventos'
                  }
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={webhookBase64}
                    onChange={e => setWebhookBase64(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                    Enviar mídia como Base64
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={webhookByEvents}
                    onChange={e => setWebhookByEvents(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                    Separar por eventos
                  </span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Eventos Monitorados ({Object.values(webhookEventStates).filter(Boolean).length}/{EVENTS.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={markAllWebhook}
                      className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      Marcar Todos
                    </button>
                    <button
                      onClick={unmarkAllWebhook}
                      className="px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  {EVENTS.map(event => (
                    <label
                      key={event}
                      className={`
                        flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all
                        ${webhookEventStates[event]
                          ? 'bg-primary/10 border-2 border-primary dark:bg-primary/20'
                          : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={webhookEventStates[event]}
                        onChange={() => handleWebhookEventChange(event)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        {event}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* WebSocket Tab */}
          {activeTab === 'websocket' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">WebSocket</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure eventos em tempo real via WebSocket
                  </p>
                </div>
                <button
                  onClick={() => setWsEnabled(!wsEnabled)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {wsEnabled ? (
                    <FiToggleRight className="text-2xl text-green-600 dark:text-green-400" />
                  ) : (
                    <FiToggleLeft className="text-2xl text-gray-400" />
                  )}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {wsEnabled ? 'Ativo' : 'Inativo'}
                  </span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Eventos Monitorados ({Object.values(wsEventStates).filter(Boolean).length}/{EVENTS.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={markAllWs}
                      className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      Marcar Todos
                    </button>
                    <button
                      onClick={unmarkAllWs}
                      className="px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  {EVENTS.map(event => (
                    <label
                      key={event}
                      className={`
                        flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all
                        ${wsEventStates[event]
                          ? 'bg-primary/10 border-2 border-primary dark:bg-primary/20'
                          : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={wsEventStates[event]}
                        onChange={() => handleWsEventChange(event)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        {event}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>Salvar Configuração</span>
                  </>
                )}
              </button>
              
              <button
                onClick={loadConfig}
                disabled={loading}
                className="px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
