// Tipos TypeScript para o chat e integração n8n

export type MessageRole = 'user' | 'assistant';

export type MessageContentType = 'text' | 'image' | 'file' | 'audio';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  contentType: MessageContentType;
  timestamp: Date;
  imageUrl?: string;
  fileName?: string;
  audioUrl?: string;
  replyTo?: string;
  sessionId?: string;
}

export interface N8nConfig {
  webhookUrl: string;
  authToken?: string;
  chatName: string;
  sessionId: string;
}

export interface N8nRequest {
  message?: string;
  file?: string; // base64 ou URL
  fileName?: string;
  fileType?: string;
  session_id: string;
}

export interface N8nResponse {
  type: 'text' | 'image';
  content?: string;
  url?: string;
  error?: string;
  output?: any; // Added to handle dynamic webhook responses
  Resposta?: string; // Added to match the specific webhook response format
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  config: N8nConfig;
  theme: 'light' | 'dark';
  sessions: string[];
  currentSessionId: string;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  addMessageFromWebSocket: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  updateConfig: (config: Partial<N8nConfig>) => void;
  updateConfigServer: (config: Partial<N8nConfig>) => Promise<void>;
  toggleTheme: () => void;
  clearMessages: () => void;
  addSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  getMessagesBySession: (sessionId: string) => Message[];
  clearSessionMessages: (sessionId: string) => void;
  sessionNames: { [sessionId: string]: string };
  renameSession: (sessionId: string, name: string) => void;
  deleteSession: (sessionId: string) => void;
}
