// Store Zustand para gerenciar estado do chat
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ChatState, Message, N8nConfig } from './types';

// Configuração de limites para evitar quota exceeded
const MAX_MESSAGES_IN_STORAGE = 50; // Manter apenas últimas 50 mensagens no localStorage
const MAX_SESSIONS_IN_STORAGE = 5; // Manter apenas últimas 5 sessões no localStorage

// Configuração padrão
const defaultConfig: N8nConfig = {
  webhookUrl: 'https://n8n.easydev.com.br/webhook/ia-agent-ubva',
  authToken: '',
  chatName: 'Carlos IA',
  sessionId: uuidv4(),
};

// Storage wrapper com tratamento de quota exceeded
const safeStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded, limpando dados antigos...');
        // Tentar limpar e salvar novamente
        try {
          localStorage.removeItem(name);
          localStorage.setItem(name, value);
          console.log('Storage limpo e dados salvos com sucesso');
        } catch (retryError) {
          console.error('Falha ao salvar mesmo após limpeza:', retryError);
        }
      } else {
        console.error('Erro ao salvar no localStorage:', e);
      }
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (e) {
      console.error('Erro ao remover do localStorage:', e);
    }
  },
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      config: defaultConfig,
      theme: 'dark' as const,
      // Sessões de conversa
      sessions: [defaultConfig.sessionId],
      currentSessionId: defaultConfig.sessionId,
      sessionNames: { [defaultConfig.sessionId]: 'Sessão 1' },

      addMessage: (message: Omit<Message, 'id' | 'timestamp'>) =>
        set((state) => {
          const msg = {
            ...message,
            id: uuidv4(),
            timestamp: new Date(),
            sessionId: message.sessionId || state.currentSessionId,
          } as Message;

          console.log('[Store] Adding message:', {
            id: msg.id,
            role: msg.role,
            content: msg.content.substring(0, 50),
            contentType: msg.contentType,
          });

          // Fire-and-forget persist to server API
          (async () => {
            try {
              const payload: any = {
                sessionId: msg.sessionId,
                role: msg.role,
                content: msg.content,
                contentType: msg.contentType || 'text',
                imageUrl: msg.imageUrl || undefined,
                audioUrl: msg.audioUrl || undefined,
              };
              
              // Incluir audioBase64 e mimeType se disponível (para transcrição posterior)
              if (msg.contentType === 'audio' && (message as any).audioBase64) {
                payload.audioBase64 = (message as any).audioBase64;
                payload.mimeType = (message as any).mimeType || 'audio/webm';
              }

              // Add user metadata if available
              const nome_completo = localStorage.getItem('userName');
              const remote_jid = localStorage.getItem('whatsappNumber');
              if (nome_completo) payload.nome_completo = nome_completo;
              if (remote_jid) payload.remote_jid = remote_jid;

              await fetch('/api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
            } catch (e) {
              console.error('Failed to persist message to server:', e);
            }
          })();

          // Limitar número de mensagens no localStorage para evitar quota exceeded
          const allMessages = [...state.messages, msg];
          const limitedMessages = allMessages.slice(-MAX_MESSAGES_IN_STORAGE);

          // Return immediately to update UI faster
          return {
            messages: limitedMessages,
          };
        }),

      // Adicionar mensagem recebida via WebSocket (já possui id e timestamp)
      addMessageFromWebSocket: (message: Message) =>
        set((state) => {
          // Verificar se a mensagem já existe
          const exists = state.messages.some(m => m.id === message.id);
          if (exists) {
            console.log('[Store] Message already exists, skipping:', message.id);
            return state;
          }
          
          console.log('[Store] Adding message from WebSocket:', {
            id: message.id,
            role: message.role,
            content: message.content.substring(0, 50),
            contentType: message.contentType,
          });
          
          // Limitar número de mensagens no localStorage
          const allMessages = [...state.messages, message];
          const limitedMessages = allMessages.slice(-MAX_MESSAGES_IN_STORAGE);
          
          return {
            messages: limitedMessages,
          };
        }),

      addSession: (sessionId: string) =>
        set((state) => {
          const name = `Sessão ${state.sessions.length + 1}`;
          // Try to persist session on server (fire-and-forget)
          (async () => {
            try {
              await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: sessionId, name }),
              });
            } catch (e) {
              console.error('Failed to persist session to server:', e);
            }
          })();

          return {
            sessions: [...state.sessions, sessionId],
            sessionNames: { ...state.sessionNames, [sessionId]: name },
          };
        }),

      setCurrentSession: (sessionId: string) => set({ currentSessionId: sessionId }),

      getMessagesBySession: (sessionId: string) => {
        const state = get();
        return state.messages.filter((msg) => msg.sessionId === sessionId);
      },

      clearSessionMessages: (sessionId: string) =>
        set((state) => ({
          messages: state.messages.filter((msg) => msg.sessionId !== sessionId),
        })),

      renameSession: (sessionId: string, name: string) =>
        set((state) => ({
          sessionNames: { ...state.sessionNames, [sessionId]: name },
        })),

      deleteSession: (sessionId: string) =>
        set((state) => {
          const filteredSessions = state.sessions.filter((id) => id !== sessionId);
          const filteredMessages = state.messages.filter((msg) => msg.sessionId !== sessionId);
          const { [sessionId]: _, ...restNames } = state.sessionNames;
          let newCurrentSessionId = state.currentSessionId;
          if (state.currentSessionId === sessionId && filteredSessions.length > 0) {
            newCurrentSessionId = filteredSessions[0];
          }
          return {
            sessions: filteredSessions,
            messages: filteredMessages,
            sessionNames: restNames,
            currentSessionId: newCurrentSessionId,
          };
        }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      updateConfig: (newConfig: Partial<N8nConfig>) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      // Persist configuration server-side as well
      updateConfigServer: async (newConfig: Partial<N8nConfig>) => {
        const state = get();
        const merged = { ...state.config, ...newConfig };
        // Fire-and-forget POST to persist config
        (async () => {
          try {
            await fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(merged),
            });
          } catch (e) {
            console.error('Failed to persist config to server:', e);
          }
        })();
        set({ config: merged });
      },

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'chat-storage',
      storage: {
        getItem: (name) => {
          const str = safeStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          safeStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          safeStorage.removeItem(name);
        },
      },
      partialize: (state: ChatState): Partial<ChatState> => ({
        config: state.config,
        theme: state.theme,
        messages: state.messages.slice(-MAX_MESSAGES_IN_STORAGE), // Limitar mensagens persistidas
        sessions: state.sessions.slice(-MAX_SESSIONS_IN_STORAGE), // Limitar sessões persistidas
        sessionNames: state.sessionNames,
        currentSessionId: state.currentSessionId,
      }),
      // Adicionar tratamento de erro para quota exceeded
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Erro ao carregar storage:', error);
          // Limpar storage se houver erro
          try {
            localStorage.removeItem('chat-storage');
          } catch (e) {
            console.error('Erro ao limpar storage:', e);
          }
        }
      },
    }
  )
);
