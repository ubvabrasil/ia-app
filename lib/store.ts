// Store Zustand para gerenciar estado do chat
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ChatState, Message, N8nConfig } from './types';

// Configuração padrão
const defaultConfig: N8nConfig = {
  webhookUrl: 'https://n8n.easydev.com.br/webhook-test/ia-agent-ubva',
  authToken: '',
  chatName: 'Carlos IA',
  sessionId: uuidv4(),
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

          // Fire-and-forget persist to server API
          (async () => {
            try {
              await fetch('/api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: msg.sessionId,
                  role: msg.role,
                  content: msg.content,
                  contentType: msg.contentType || 'text',
                }),
              });
            } catch (e) {
              // swallow network errors (still persisted in localStorage)
              console.error('Failed to persist message to server:', e);
            }
          })();

          return {
            messages: [
              ...state.messages,
              msg,
            ],
          };
        }),

      // Adicionar mensagem recebida via WebSocket (já possui id e timestamp)
      addMessageFromWebSocket: (message: Message) =>
        set((state) => {
          // Verificar se a mensagem já existe
          const exists = state.messages.some(m => m.id === message.id);
          if (exists) {
            return state;
          }
          return {
            messages: [...state.messages, message],
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
      partialize: (state) => ({
        config: state.config,
        theme: state.theme,
        messages: state.messages, // Persiste histórico
        sessions: state.sessions,
        sessionNames: state.sessionNames,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);
