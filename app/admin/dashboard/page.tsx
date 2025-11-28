'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChatStore } from '@/lib/store';
import { Message } from '@/lib/types';
import { MessageBubble } from '@/components/MessageBubble';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
// utils.cn not used here
import { parseDbTimestamp, formatToSaoPaulo, formatToYMD } from '@/server/datetime';

import { ThemeToggle } from '@/components/ThemeToggle';
import { SortAsc, SortDesc, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import WebhookPanel from '@/app/admin/webhook-panel/page';
import { FaBroom } from 'react-icons/fa';

interface SessionData {
  sessionId: string;
  sessionName: string;
  nome_completo?: string | null;
  remote_jid?: string | null;
  messages: Message[];
  messageCount: number;
  lastActivity: Date | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [transcribingAudio, setTranscribingAudio] = useState<string | null>(null);
  const [audioTranscriptions, setAudioTranscriptions] = useState<Record<string, string>>({});
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const store = useChatStore();

  // WebSocket para receber atualizações em tempo real
  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'message') {
      console.log('📨 Nova mensagem recebida no admin:', message.data);
      // Nova mensagem será carregada pelo polling automático
    }
  });

  // Carregar mensagens de uma sessão específica
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/session/${sessionId}/messages`);
      if (!res.ok) {
        console.error('Erro ao carregar mensagens da sessão:', res.status);
        return [];
      }
      const messages = await res.json();
      
      // Normalizar mensagens
      return (Array.isArray(messages) ? messages : []).map((m: any) => {
        let imageUrl = m.imageUrl || m.image_url || undefined;
        let audioUrl = m.audioUrl || m.audio_url || undefined;
        let contentType = m.contentType || m.content_type || 'text';
        
        if (audioUrl) {
          contentType = 'audio';
        }
        
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:image/')) {
          contentType = 'image';
        } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.match(/^([A-Za-z0-9+/=]+)$/)) {
          imageUrl = `data:image/png;base64,${imageUrl}`;
          contentType = 'image';
        }
        
        return {
          id: m.id || m._id || String(Math.random()),
          role: m.role || m.sender || 'assistant',
          content: audioUrl || m.content || m.text || '',
          contentType,
          timestamp: parseDbTimestamp(m.timestamp || m.created_at || m.createdAt),
          imageUrl,
          audioUrl,
          audioBase64: m.audioBase64 || m.audio_base64,
          mimeType: m.mimeType || m.mime_type || (contentType === 'audio' ? 'audio/webm' : undefined),
          fileName: m.fileName || m.file_name,
          sessionId: m.sessionId || m.session_id || sessionId,
        };
      });
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      return [];
    }
  }, []);

  

  const loadSessions = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (loadingRef.current || !mountedRef.current) {
      return;
    }
    
    loadingRef.current = true;
    
    try {
      // Usar endpoint otimizado para listar sessões
      const res = await fetch('/api/session/summary');
      if (!res.ok) {
        console.error('Erro ao carregar sessões:', res.status, res.statusText);
        return;
      }
      const sessionsSummary = await res.json();
      
      // Validar se sessionsSummary é um array
      if (!Array.isArray(sessionsSummary)) {
        console.error('Resposta inválida da API /api/session/summary:', sessionsSummary);
        return;
      }
      
      if (!mountedRef.current) return;
      
      const sessionNames = store.sessionNames || {};
      
      // Mapear resumo das sessões (sem mensagens ainda)
      const sessionsData: SessionData[] = sessionsSummary.map((s: any) => {
        const displayName = s.nome_completo || sessionNames[s.id] || `Sessão ${s.id.slice(0, 8)}`;
        return {
          sessionId: s.id,
          sessionName: displayName,
          nome_completo: s.nome_completo || null,
          remote_jid: s.remote_jid || null,
          messages: [], // Carregar sob demanda
          messageCount: s.message_count || 0,
          lastActivity: s.last_activity ? parseDbTimestamp(s.last_activity) : null,
        };
      });
      
      // Ordenar por última atividade conforme sortOrder
      sessionsData.sort((a, b) => {
        const aTime = a.lastActivity ? a.lastActivity.getTime() : new Date(0).getTime();
        const bTime = b.lastActivity ? b.lastActivity.getTime() : new Date(0).getTime();
        return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
      });
      
      if (!mountedRef.current) return;
      
      // Manter mensagens da sessão atualmente selecionada
      setSessions(prev => {
        return sessionsData.map(newSession => {
          const oldSession = prev.find(s => s.sessionId === newSession.sessionId);
          // Se a sessão estava selecionada e já tinha mensagens carregadas, manter
          if (oldSession && oldSession.sessionId === selectedSession && oldSession.messages.length > 0) {
            return { ...newSession, messages: oldSession.messages };
          }
          return newSession;
        });
      });
      
      // compute unread based on last seen admin timestamp
      try {
        const lastSeen = Number(sessionStorage.getItem('adminLastSeen') || '0');
        const count = sessionsData.filter(s => s.lastActivity && s.lastActivity.getTime() > lastSeen).length;
        setUnreadCount(count);
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Erro ao carregar sessões do backend:', err);
    } finally {
      loadingRef.current = false;
    }
  }, [store, sortOrder, selectedSession]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Verificar autenticação
    const adminAuth = sessionStorage.getItem('adminAuth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);

    // Carregar datas disponíveis
    const loadDates = async () => {
      try {
        const res = await fetch('/api/session/dates');
        if (res.ok) {
          const dates = await res.json();
          setAvailableDates(dates);
        }
      } catch (err) {
        console.error('Erro ao carregar datas:', err);
      }
    };

    // Predefinir o período para HOJE por padrão (usuário pode alterar)
    try {
      if (!startDate && !endDate) {
        const now = parseDbTimestamp(Date.now());
        const iso = formatToYMD(now) || '';
        setStartDate(iso);
        setEndDate(iso);
      }
    } catch {
      // ignore date errors
    }

    // Carregar todas as sessões
    loadDates();
    loadSessions();

    // POLLING DESABILITADO - Use o botão de atualização manual no header
    // Isso evita que a conversa seja interrompida enquanto você está lendo

    return () => {
      mountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Auto-transcrever áudios ao carregar mensagens
  useEffect(() => {
    if (!selectedSession || !sessions.length) return;
    
    const session = sessions.find(s => s.sessionId === selectedSession);
    if (!session?.messages) return;
    
    // Transcrever automaticamente todos os áudios que ainda não foram transcritos
    const audioMessages = session.messages.filter(msg => 
      msg.contentType === 'audio' && 
      !audioTranscriptions[msg.id] && 
      transcribingAudio !== msg.id &&
      (((msg as any).audioBase64) || msg.audioUrl)
    );
    
    // Transcrever um de cada vez para evitar sobrecarga
    if (audioMessages.length > 0 && !transcribingAudio) {
      const firstAudio = audioMessages[0];
      transcribeAudio(firstAudio.audioUrl || firstAudio.content, firstAudio.id, firstAudio);
    }
  }, [selectedSession, sessions, audioTranscriptions, transcribingAudio]);

  const transcribeAudio = async (audioUrl: string, messageId: string, message?: any) => {
    try {
      setTranscribingAudio(messageId);
      
      let audioBlob: Blob;
      
      // Se tiver audioBase64 na mensagem, usar diretamente
      if (message?.audioBase64) {
        const mimeType = message.mimeType || 'audio/webm';
        const base64Response = await fetch(`data:${mimeType};base64,${message.audioBase64}`);
        audioBlob = await base64Response.blob();
      } else if (audioUrl && audioUrl.startsWith('blob:')) {
        // Se for blob URL, fazer fetch direto
        const audioResponse = await fetch(audioUrl);
        audioBlob = await audioResponse.blob();
      } else if (audioUrl && audioUrl.startsWith('data:')) {
        // Se for data URL, converter
        const audioResponse = await fetch(audioUrl);
        audioBlob = await audioResponse.blob();
      } else {
        throw new Error('Formato de áudio não suportado para transcrição');
      }
      
      // Preparar FormData para Groq
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'pt');
      formData.append('response_format', 'json');
      
      // Chamar API Groq
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`
                },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro Groq API:', errorText);
        throw new Error(`Erro na transcrição: ${response.status}`);
      }
      
      const result = await response.json();
      const transcription = result.text || 'Transcrição não disponível';
      
      // Salvar transcrição
      setAudioTranscriptions(prev => ({
        ...prev,
        [messageId]: transcription,
      }));
      
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      setAudioTranscriptions(prev => ({
        ...prev,
        [messageId]: `Erro: ${error instanceof Error ? error.message : 'Falha na transcrição'}`,
      }));
    } finally {
      setTranscribingAudio(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminToken');
    router.push('/admin');
  };

  // Garantir ordenação: última atividade primeiro
  sessions.sort((a, b) => {
    const aTime = a.lastActivity ? a.lastActivity.getTime() : new Date(0).getTime();
    const bTime = b.lastActivity ? b.lastActivity.getTime() : new Date(0).getTime();
    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
  });

  const filteredSessions = sessions.filter(session => {
    const matchesText = session.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) || session.sessionId.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesText) return false;
    // If a date range is chosen, include sessions that have at least one message inside the period
    if (startDate || endDate) {
      const s = startDate ? parseDbTimestamp(startDate) : null;
      const e = endDate ? parseDbTimestamp(endDate) : null;
      const hasInRange = session.messages.some((m) => {
        const t = parseDbTimestamp(m.timestamp);
        if (!t) return false;
        // Compare only the date part (YYYY-MM-DD) to ensure inclusivity
        const tYMD = formatToYMD(t);
        const sYMD = s ? formatToYMD(s) : null;
        const eYMD = e ? formatToYMD(e) : null;
        if (sYMD && tYMD && tYMD < sYMD) return false;
        if (eYMD && tYMD && tYMD > eYMD) return false;
        return true;
      });
      if (!hasInRange) return false;
    }
    return true;
  });

  // Usar datas carregadas do banco de dados
  const availableDatesAsc = availableDates.sort((a, b) => (a < b ? -1 : 1));

  const selectedSessionData = selectedSession
    ? sessions.find(s => s.sessionId === selectedSession)
    : null;

  // Carregar mensagens quando uma sessão é selecionada
  useEffect(() => {
    if (selectedSession && selectedSessionData && selectedSessionData.messages.length === 0) {
      loadSessionMessages(selectedSession).then(messages => {
        if (!mountedRef.current) return;
        setSessions(prev => prev.map(s => 
          s.sessionId === selectedSession 
            ? { ...s, messages } 
            : s
        ));
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession]);

  // Optional small notifications panel (shows recent sessions with activity)
  const recentSessions = sessions.slice(0, 6);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  // Calcular métricas do dashboard
  const totalSessions = sessions.length;
  const totalMessages = sessions.reduce((acc, s) => acc + s.messageCount, 0);
  const todaySessions = sessions.filter(s => {
    const today = new Date();
    const sessionDate = s.lastActivity;
    return sessionDate && sessionDate.toDateString() === today.toDateString();
  }).length;
  const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 p-3 shadow-lg transition-all hover:shadow-primary/20 hover:shadow-2xl group">
              <svg
                className="w-6 h-6 text-primary-foreground group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                Dashboard Admin
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {totalSessions} sessões
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  {totalMessages} mensagens
                </span>
              </p>
            </div>
            {/* Indicador de conexão WebSocket */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all ${
              isConnected
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 shadow-green-500/10'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 shadow-red-500/10'
              }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></span>
              {isConnected ? 'Tempo Real' : 'Offline'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Botão de atualização manual */}
            <button
              onClick={async () => {
                loadSessions();
                // Recarregar datas também
                try {
                  const res = await fetch('/api/session/dates');
                  if (res.ok) {
                    const dates = await res.json();
                    setAvailableDates(dates);
                  }
                } catch (err) {
                  console.error('Erro ao recarregar datas:', err);
                }
              }}
              disabled={loadingRef.current}
              className="p-2 rounded-lg hover:bg-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              aria-label="Atualizar sessões"
              title="Atualizar sessões manualmente"
            >
              <svg 
                className={`w-5 h-5 text-foreground ${loadingRef.current ? 'animate-spin' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Notificação: sino com badge vermelho */}
            <div className="relative">
              <button
              className="relative p-2 rounded hover:bg-accent transition-colors"
              onClick={() => {
                try { sessionStorage.setItem('adminLastSeen', String(Date.now())); } catch { }
                setUnreadCount(0);
                setShowNotifications((s) => !s);
              }}
              aria-label="Notificações"
              title="Notificações"
              >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
                </span>
              )}
              </button>
                {/* Painel de notificações */}
                <div className="relative">
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-xs text-white font-bold animate-bounce shadow-lg z-10">
                  {unreadCount}
                  </span>
                )}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <div className="bg-blue-50 dark:bg-blue-950 px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Novas conversas</h3>
                    <button
                    className="text-xs text-blue-600 dark:text-blue-300 hover:underline"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Fechar painel de notificações"
                    >
                    Fechar
                    </button>
                  </div>
                  <div className="p-4 max-h-80 overflow-y-auto">
                    {recentSessions.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Nenhuma conversa recente.</p>
                    ) : (
                    <ul className="space-y-3">
                      {recentSessions.map((s) => {
                      const lastMessages = s.messages
                        .slice(-2)
                        .filter(m => m.contentType === 'text' && m.content && typeof m.content === 'string');
                      return (
                        <li key={s.sessionId}>
                        <button
                          className="w-full text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex flex-col gap-1 border border-transparent hover:border-blue-300 dark:hover:border-blue-700"
                          onClick={() => {
                          setSelectedSession(s.sessionId);
                          setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-700 dark:text-blue-300 truncate">{s.sessionName}</span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">{s.lastActivity ? formatToSaoPaulo(s.lastActivity) : 'Sem atividade'}</span>
                          </div>
                          {lastMessages.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {lastMessages.map((m, idx) => (
                            <div
                              key={m.id || idx}
                              className="text-xs text-slate-700 dark:text-zinc-200 truncate"
                              title={m.content}
                            >
                              <span className="font-semibold">{m.role === 'user' ? 'Cliente:' : 'Bot:'}</span>{' '}
                              {m.content.length > 60 ? m.content.slice(0, 60) + '...' : m.content}
                            </div>
                            ))}
                          </div>
                          )}
                        </button>
                        </li>
                      );
                      })}
                    </ul>
                    )}
                  </div>
                  </div>
                )}
                </div>
            </div>
            
            {/* Sort toggle: newest/oldest */}
            <Button
              variant="outline"
              onClick={() => {
                const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
                setSortOrder(newOrder);
                // re-sort current sessions according to new order
                setSessions((prev) => [...prev].sort((a, b) => {
                  const aTime = a.lastActivity ? a.lastActivity.getTime() : 0;
                  const bTime = b.lastActivity ? b.lastActivity.getTime() : 0;
                  return newOrder === 'desc' ? bTime - aTime : aTime - bTime;
                }));
              }}
              className="border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title={sortOrder === 'desc' ? 'Ordenar: do mais novo ao mais antigo' : 'Ordenar: do mais antigo ao mais novo'}
              aria-label="Alternar ordenação por hora"
            >
              {sortOrder === 'desc' ? <SortDesc className="w-4 h-4 mr-2" /> : <SortAsc className="w-4 h-4 mr-2" />}
              {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigos'}
            </Button>
            {/* Link rápido para o Painel de Webhook no menu (abre em popup) */}
            <Button
              variant="ghost"
              onClick={() => setShowWebhookModal(true)}
              className="text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              aria-label="Abrir Painel de Webhook"
            >
              Painel de Webhook
            </Button>
            <Dialog open={showWebhookModal} onOpenChange={(open) => setShowWebhookModal(open)}>
              <DialogContent className="max-w-5xl w-full">
                <DialogHeader>
                  <DialogTitle>Painel de Webhook</DialogTitle>
                  <DialogDescription>Configure e teste webhooks para eventos do sistema.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 h-[75vh] max-h-[75vh] overflow-auto px-2">
                  {/* make inner panel scrollable and fit the modal */}
                  <div className="max-w-none mx-auto w-full">
                    <WebhookPanel />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                      Fechar
                    </button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout} className="border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Metrics Cards Section */}
      <div className="container mx-auto px-6 py-6 pt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sessions Card */}
          <Card className="border-border bg-card shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all hover:-translate-y-1 group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Total de Sessões</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform">{totalSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">Conversas registradas</p>
            </CardContent>
          </Card>

          {/* Today Sessions Card */}
          <Card className="border-border bg-card shadow-lg hover:shadow-2xl hover:shadow-green-500/10 transition-all hover:-translate-y-1 group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Sessões Hoje</CardTitle>
                <div className="rounded-lg bg-green-500/10 p-2 group-hover:bg-green-500/20 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform">{todaySessions}</div>
              <p className="text-xs text-muted-foreground mt-1">Ativas nas últimas 24h</p>
            </CardContent>
          </Card>

          {/* Total Messages Card */}
          <Card className="border-border bg-card shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 transition-all hover:-translate-y-1 group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Total de Mensagens</CardTitle>
                <div className="rounded-lg bg-purple-500/10 p-2 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform">{totalMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">Trocadas com o bot</p>
            </CardContent>
          </Card>

          {/* Average Messages Card */}
          <Card className="border-border bg-card shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 transition-all hover:-translate-y-1 group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Média por Sessão</CardTitle>
                <div className="rounded-lg bg-orange-500/10 p-2 group-hover:bg-orange-500/20 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform">{avgMessagesPerSession}</div>
              <p className="text-xs text-muted-foreground mt-1">Mensagens por conversa</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div
        className="container mx-auto px-6 pb-6 flex flex-col max-h-[calc(100vh-16rem)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
          {/* Lista de Sessões */}
            <div className="lg:col-span-1 flex flex-col overflow-hidden rounded-xl border-border bg-card shadow-lg h-full">
            <Card className="bg-card/50 border-border shadow-md flex flex-col h-full">
              <CardHeader className="shrink-0">
              <CardTitle className="text-foreground">
                Sessões de Conversa
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Clique em uma sessão para ver os detalhes
              </CardDescription>
              <div className="mt-2 text-sm text-muted-foreground">
                {filteredSessions.length} sessões encontradas
              </div>

              {/* Filtro de busca e período */}
              <div className="mt-4">
                <input
                type="text"
                placeholder="Buscar sessão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
                />

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <div className="sm:col-span-2 relative">
                  <button
                  onClick={() => setShowPeriodPicker((s) => !s)}
                  className="w-full text-left px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  aria-haspopup="true"
                  aria-expanded={showPeriodPicker}
                  >
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                    {startDate && endDate
                      ? `${startDate} — ${endDate}`
                      : availableDatesAsc.length > 0
                      ? `${availableDatesAsc[0]} — ${availableDatesAsc[availableDatesAsc.length - 1]}`
                      : 'Sem datas disponíveis'}
                    </div>
                    <svg
                    className="w-4 h-4 text-slate-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                    </svg>
                  </div>
                  </button>

                  {showPeriodPicker && (
                  <div className="absolute left-0 mt-2 w-[380px] z-30 bg-card border border-border rounded shadow-lg p-3">
                    <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">
                      Início
                      </label>
                      <select
                      value={startDate || ''}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setStartDate(val);
                        if (val && endDate && endDate < val) {
                        setEndDate(null);
                        }
                      }}
                      className="w-full mt-1 px-2 py-2 border border-border rounded-md bg-background text-foreground"
                      >
                      <option value="">Todas</option>
                      {availableDatesAsc.map((d) => (
                        <option key={d} value={d}>
                        {d}
                        </option>
                      ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">
                      Fim
                      </label>
                      <select
                      value={endDate || ''}
                      onChange={(e) => setEndDate(e.target.value || null)}
                      className="w-full mt-1 px-2 py-2 border border-border rounded-md bg-background text-foreground"
                      >
                      <option value="">Todas</option>
                      {(startDate
                        ? availableDatesAsc.filter((d) => d >= startDate)
                        : availableDatesAsc
                      ).map((d) => (
                        <option key={d} value={d}>
                        {d}
                        </option>
                      ))}
                      </select>
                    </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setShowPeriodPicker(false);
                      }}
                      className="text-sm text-muted-foreground px-3 py-1 rounded-md hover:bg-accent"
                    >
                      Limpar
                    </button>
                    <div>
                      <button
                      onClick={() => setShowPeriodPicker(false)}
                      className="inline-flex items-center px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
                      >
                      Aplicar
                      </button>
                    </div>
                    </div>
                  </div>
                  )}
                </div>
                <div className="flex sm:justify-start justify-end">
                  <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                  className="p-2 rounded flex items-center justify-center"
                  title="Limpar filtros"
                  aria-label="Limpar filtros"
                  >
                  <FaBroom className="w-5 h-5 text-slate-700 dark:text-zinc-300" />
                  </Button>
                </div>
                </div>
              </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {/* Mostra todas as sessões do dia selecionado, mesmo que tenham poucas mensagens */}
                {filteredSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma sessão encontrada
                </p>
                ) : (
                filteredSessions.map((session) => (
                  <button
                  key={session.sessionId}
                  onClick={() => setSelectedSession(session.sessionId)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedSession === session.sessionId
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                  >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm truncate text-foreground">
                    {session.sessionName}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                    {session.messageCount} msgs
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {session.lastActivity ? formatToSaoPaulo(session.lastActivity) : 'Sem atividade'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    ID: {session.sessionId.slice(0, 8)}...
                  </p>
                  {session.nome_completo && (
                    <p className="text-xs text-muted-foreground mt-1">
                    Nome: {session.nome_completo}
                    </p>
                  )}
                  {session.remote_jid && (
                    <p className="text-xs text-muted-foreground mt-1">
                    WhatsApp: {session.remote_jid}
                    </p>
                  )}
                  {/* Mostrar todas as datas das mensagens da sessão */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.from(
                    new Set(
                      session.messages.map((m) => {
                      const d = parseDbTimestamp(m.timestamp);
                      return d ? formatToYMD(d) : null;
                      }).filter(Boolean)
                    )
                    ).map((date) => (
                    <span
                      key={date}
                      className="px-2 py-0.5 bg-accent text-xs rounded text-foreground border border-border"
                    >
                      {date}
                    </span>
                    ))}
                  </div>
                  </button>
                ))
                )}
              </div>
              </CardContent>
            </Card>
            </div>

          {/* Detalhe da Sessão */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden h-full">
            {selectedSessionData ? (
              <Card className="bg-card/50 border-border shadow-md flex flex-col h-full">
                <CardHeader className="shrink-0">
                  <CardTitle className="text-foreground">
                    {selectedSessionData.sessionName}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {selectedSessionData.messageCount} mensagens | Última atividade:{' '}
                    {selectedSessionData.lastActivity ? formatToSaoPaulo(selectedSessionData.lastActivity) : 'Sem atividade'}
                  </CardDescription>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground font-mono">
                      Session ID: {selectedSessionData.sessionId}
                    </p>
                    {selectedSessionData.nome_completo && (
                      <p className="text-xs text-muted-foreground">
                        Nome do cliente: {selectedSessionData.nome_completo}
                      </p>
                    )}
                    {selectedSessionData.remote_jid && (
                      <p className="text-xs text-muted-foreground">
                        WhatsApp: {selectedSessionData.remote_jid}
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {selectedSessionData.messages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma mensagem nesta sessão
                      </p>
                    ) : (
                      selectedSessionData.messages.map((message, idx) => (
                        <div key={message.id || idx} className="space-y-2">
                          <MessageBubble
                            message={message}
                            userName={selectedSessionData.nome_completo || undefined}
                          />
                          
                          {/* Botão de transcrição para mensagens de áudio */}
                          {message.contentType === 'audio' && (message.audioUrl || (message as any).audioBase64 || message.content) && (
                            <div className={`${message.role === 'user' ? 'ml-auto' : 'mr-auto'} max-w-md`}>
                              {audioTranscriptions[message.id] ? (
                                <div className="bg-accent/50 rounded-lg p-3 border border-border">
                                  <p className="text-xs font-semibold text-foreground mb-1">🎤 Transcrição:</p>
                                  <p className="text-sm text-foreground italic">{audioTranscriptions[message.id]}</p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => transcribeAudio(message.audioUrl || message.content, message.id, message)}
                                  disabled={transcribingAudio === message.id}
                                  className="w-full text-xs px-3 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                  {transcribingAudio === message.id ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Transcrevendo...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Transcrever áudio
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border shadow-md flex items-center justify-center flex-1">
                <CardContent className="text-center py-24">
                  <svg
                    className="w-16 h-16 mx-auto text-muted-foreground mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-muted-foreground">
                    Selecione uma sessão para ver as conversas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
