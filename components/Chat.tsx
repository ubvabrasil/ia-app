// Componente principal do Chat
'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { N8nService } from '@/lib/n8n-service';
import { MessageBubble } from './MessageBubble';
import { FileUploader } from './FileUploader';
import { AudioRecorder } from './AudioRecorder';
import { MicrophonePermissionBanner } from './MicrophonePermissionBanner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { Message } from '@/lib/types';

const Sidebar = ({
  isExpanded,
  toggleSidebar,
  handleNewSession,
  sessions,
  currentSessionId,
  setCurrentSession,
  sessionNames,
  renameSession,
  deleteSession,
}: {
  isExpanded: boolean;
  toggleSidebar: () => void;
  handleNewSession: () => void;
  sessions: string[];
  currentSessionId: string;
  setCurrentSession: (id: string) => void;
  sessionNames: Record<string, string>;
  renameSession: (id: string, name: string) => void;
  deleteSession: (id: string) => void;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  return (
    <aside className={`fixed left-0 top-24 bottom-0 ${isExpanded ? 'w-72' : 'w-16'} bg-muted shadow-lg rounded-r-lg flex flex-col z-20 transition-width duration-300`}>
      {/* Botão de colapsar/expandir sidebar centralizado */}
      <div className="flex items-center justify-center p-4">
        <button
          className="bg-primary text-white rounded-full p-2 shadow hover:bg-primary/80 transition-all"
          onClick={toggleSidebar}
          aria-label={isExpanded ? 'Colapsar sidebar' : 'Expandir sidebar'}
          style={{ width: 40, height: 40 }}
        >
          {isExpanded ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
          )}
        </button>
      </div>
      {/* New session button */}
      <div className="flex items-center justify-center p-4">
        <button
          className={`rounded-full bg-gradient-to-r from-primary to-[#4ABF90] text-white shadow hover:bg-primary/90 flex items-center transition-all duration-300 ease-in-out
            ${isExpanded ? 'gap-3 w-full h-12 px-4' : 'flex-col w-12 h-12 gap-1 px-0 py-0 justify-center'}`}
          onClick={handleNewSession}
          title="Nova Sessão"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          {isExpanded && <span className="text-base font-semibold transition-opacity duration-300 ease-in-out opacity-100">Nova Sessão</span>}
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2">
        {sessions.map((sessionId) => (
          <div
            key={sessionId}
            className={`w-full flex items-center ${isExpanded ? 'gap-3 p-2' : 'justify-center p-1'} rounded-md hover:bg-primary/10 ${currentSessionId === sessionId ? 'bg-primary/20' : ''}`}
          >
            <button
              onClick={() => setCurrentSession(sessionId)}
              className={`flex items-center ${isExpanded ? 'gap-3 flex-1 text-left' : 'justify-center'}`}
              aria-label={sessionNames[sessionId] || `Sessão ${sessionId}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>

              {isExpanded && (
                editingId === sessionId ? (
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameSession(sessionId, editText.trim() || sessionNames[sessionId] || `Sessão ${sessionId}`);
                        setEditingId(null);
                      }
                      if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                    className="w-full bg-transparent border-b border-border focus:outline-none text-sm"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm truncate">{sessionNames[sessionId] || `Sessão ${sessionId}`}</span>
                )
              )}
            </button>

            {/* Edit / Save / Delete controls */}
            {isExpanded && (
              <div className="flex items-center gap-2">
                {editingId === sessionId ? (
                  <>
                    <button
                      onClick={() => {
                        renameSession(sessionId, editText.trim() || sessionNames[sessionId] || `Sessão ${sessionId}`);
                        setEditingId(null);
                      }}
                      className="p-1 rounded hover:bg-primary/10"
                      aria-label="Salvar nome"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded hover:bg-primary/10"
                      aria-label="Cancelar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(sessionId);
                        setEditText(sessionNames[sessionId] || `Sessão ${sessionId}`);
                      }}
                      className="p-1 rounded hover:bg-primary/10"
                      aria-label="Editar nome"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/><path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/></svg>
                    </button>
                    <button
                      onClick={() => {
                        // If deleting the currently selected session, pick another session to select (if any)
                        if (currentSessionId === sessionId) {
                          const next = sessions.find((s) => s !== sessionId) || '';
                          setCurrentSession(next);
                        }
                        deleteSession(sessionId);
                        // clear editing state if it was open
                        if (editingId === sessionId) setEditingId(null);
                      }}
                      className="p-2 rounded hover:bg-red-100 bg-red-50 text-red-600"
                      aria-label="Deletar sessão"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 6l12 12" />
                        <path d="M6 18L18 6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toggle Button removido conforme solicitado */}
    </aside>
  );
};

export function Chat() {
  // Check localStorage for accepted policy on mount
  const [acceptedPolicy, setAcceptedPolicy] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('policyAccepted') === 'true';
    }
    return false;
  });
  const [clearFile, setClearFile] = useState(false);
  // Reset clearFile flag after FileUploader cleans up
  useEffect(() => {
    if (clearFile) {
      setClearFile(false);
    }
  }, [clearFile]);
  // Sidebar is controlled by `isSidebarExpanded`
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<Blob | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const n8nServiceRef = useRef<N8nService | null>(null);

  const {
    messages,
    isLoading,
    config,
    addMessage,
    addMessageFromWebSocket,
    setLoading,
    sessions,
    currentSessionId,
    setCurrentSession,
    addSession,
    getMessagesBySession,
    clearSessionMessages,
    sessionNames,
    renameSession,
    deleteSession,
  } = useChatStore();

  // WebSocket para sincronização em tempo real
  const { isConnected, send: wsSend } = useWebSocket((message) => {
    if (message.type === 'message' && message.data) {
      // Adicionar mensagem recebida via WebSocket
      addMessageFromWebSocket(message.data);
    }
  });

  // Cria uma sessão automaticamente ao entrar, se não houver nenhuma
  useEffect(() => {
    if (sessions.length === 0) {
      const newSessionId = uuidv4();
      addSession(newSessionId);
      setCurrentSession(newSessionId);
      clearSessionMessages(newSessionId);
    }
  }, [sessions, addSession, setCurrentSession, clearSessionMessages]);

  // Get messages for the current session
  const sessionMessages = getMessagesBySession(currentSessionId);

  // Inicializar serviço n8n
  useEffect(() => {
    n8nServiceRef.current = new N8nService(config);
  }, [config]);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função para adicionar mensagem e fazer broadcast via WebSocket
  const addMessageAndBroadcast = (message: any) => {
    const fullMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
      sessionId: message.sessionId || currentSessionId,
    };
    
    // Adicionar localmente
    addMessage(message);
    
    // Broadcast via WebSocket
    if (isConnected) {
      wsSend({
        type: 'message',
        data: fullMessage,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile && !selectedAudio) return;
    if (!config.webhookUrl) {
      alert('Configure o webhook do n8n antes de enviar mensagens');
      return;
    }

    const service = n8nServiceRef.current;
    if (!service) return;

    setLoading(true);

    try {
      if (selectedAudio) {
        // Enviar áudio
        const audioFile = new File([selectedAudio], 'audio.wav', { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(selectedAudio);

        addMessageAndBroadcast({
          role: 'user',
          content: inputMessage || 'Áudio enviado',
          contentType: 'audio',
          audioUrl: audioUrl,
          sessionId: currentSessionId,
          replyTo: replyingTo?.id,
        });

        const response = await service.sendFile(audioFile, inputMessage);
        handleN8nResponse(response);
        setSelectedAudio(null);
        setInputMessage('');
      } else if (selectedFile) {
        const isImage = selectedFile.type.startsWith('image/');
        const fileUrl = URL.createObjectURL(selectedFile);

        addMessageAndBroadcast({
          role: 'user',
          content: inputMessage || 'Arquivo enviado',
          contentType: isImage ? 'image' : 'file',
          imageUrl: isImage ? fileUrl : undefined,
          fileName: !isImage ? selectedFile.name : undefined,
          sessionId: currentSessionId,
          replyTo: replyingTo?.id,
        });

        const response = await service.sendFile(selectedFile, inputMessage);
        handleN8nResponse(response);
        setSelectedFile(null);
        setInputMessage('');
        setClearFile(true);
      } else {
        addMessageAndBroadcast({
          role: 'user',
          content: inputMessage,
          contentType: 'text',
          sessionId: currentSessionId,
          replyTo: replyingTo?.id,
        });
        const response = await service.sendMessage(inputMessage);
        handleN8nResponse(response);
        setInputMessage('');
      }
    } finally {
      setLoading(false);
      setReplyingTo(null); // Limpar estado de resposta
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleN8nResponse = (response: any) => {
    if (response.error) {
      addMessageAndBroadcast({
        role: 'assistant',
        content: response.error,
        contentType: 'text',
        sessionId: currentSessionId,
      });
      return;
    }

    if (response.type === 'image' && response.url) {
      addMessageAndBroadcast({
        role: 'assistant',
        content: response.content || '',
        contentType: 'image',
        imageUrl: response.url,
        sessionId: currentSessionId,
      });
    } else {
      addMessageAndBroadcast({
        role: 'assistant',
        content: typeof response === 'string' ? response : (response.content || response.output || 'Resposta recebida do n8n'),
        contentType: 'text',
        sessionId: currentSessionId,
      });
    }
  };

  // Sidebar session management
  const handleNewSession = () => {
  const newSessionId = uuidv4();
  addSession(newSessionId);
  setCurrentSession(newSessionId);
  clearSessionMessages(newSessionId);
  };

  return (
    <div className="flex h-full w-full pl-0">
      {!acceptedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-10 max-w-md w-full flex flex-col gap-8 border border-border text-gray-900 dark:text-white animate-fade-in">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-primary/10 rounded-full p-4 mb-2">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-center tracking-tight">Bem-vindo ao Carlos™</h2>
              <span className="text-base text-primary font-semibold text-center">Assistente com IA generativa</span>
            </div>
            <div className="space-y-4 text-sm text-center">
              <div className="bg-muted/40 rounded p-3">
                <span className="font-semibold text-muted-foreground">Por favor, leia com atenção:</span>
              </div>
              <p>
                Ao prosseguir, você reconhece o registro e a utilização das suas informações pela <span className="font-bold text-primary">UBVA</span> (e suas terceiras partes autorizadas), concorda com nossos <a href="/termos" target="_blank" className="underline text-primary font-semibold">Termos de Utilização</a> e declara que leu nossa <a href="/privacidade" target="_blank" className="underline text-primary font-semibold">Política de Privacidade</a>.
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Atenção:</span> A IA não substitui o juízo humano nem o pensamento crítico.
              </p>
            </div>
            <Button
              className="bg-primary text-white text-base font-bold py-2 px-6 rounded-lg shadow hover:bg-primary/90 transition-all"
              onClick={() => {
                localStorage.setItem('policyAccepted', 'true');
                setAcceptedPolicy(true);
              }}
            >
              Aceito e quero continuar
            </Button>
          </div>
        </div>
      )}
      {/* Topbar com botão de login mais afastado do topo/dark mode */}
      <div className="fixed top-6 right-40 z-50 flex items-center gap-4">
        {/* Botões de Login e Cadastro ocultos */}
        {isAuthenticated && (
          <button
            className="bg-muted text-primary rounded-full p-2 shadow hover:bg-muted/80 transition-all flex items-center justify-center border border-white/80"
            title="Usuário logado"
            style={{ width: 44, height: 44 }}
          >
            {/* Classic user/avatar SVG icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Popover de login próximo ao botão, com desfoque na página */}
      {showLogin && (
        <>
          {/* Desfoque na página transparente */}
          <div className="fixed inset-0 z-40 backdrop-blur-sm bg-transparent transition-all" />
          {/* Popover de login */}
          <div className="fixed top-20 right-40 z-50">
            <div className="bg-white dark:bg-card rounded-lg shadow-lg p-8 w-80 flex flex-col gap-4 border border-border">
              <h2 className="text-2xl font-bold mb-2 text-center">Login</h2>
              <input
                type="email"
                placeholder="E-mail"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="border border-border rounded px-3 py-3 w-full mb-2 text-lg font-semibold text-gray-900 bg-white dark:text-white dark:bg-card"
              />
              <input
                type="password"
                placeholder="Senha"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="border border-border rounded px-3 py-3 w-full mb-4 text-lg font-semibold text-gray-900 bg-white dark:text-white dark:bg-card"
              />
              <div className="flex gap-2">
                <Button
                  className="bg-primary text-white flex-1 text-lg font-bold py-3"
                  onClick={() => { setIsAuthenticated(true); setShowLogin(false); alert(`Login: ${loginEmail}`); }}
                >Entrar</Button>
                <Button
                  className="bg-muted text-foreground flex-1 text-lg font-bold py-3"
                  onClick={() => setShowLogin(false)}
                >Cancelar</Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Popover de cadastro próximo ao botão, com desfoque na página */}
      {showRegister && (
        <>
          {/* Desfoque na página transparente */}
          <div className="fixed inset-0 z-40 backdrop-blur-sm bg-transparent transition-all" />
          {/* Popover de cadastro */}
          <div className="fixed top-20 right-8 z-50">
            <div className="bg-white dark:bg-card rounded-lg shadow-lg p-8 w-80 flex flex-col gap-4 border border-border">
              <h2 className="text-2xl font-bold mb-2 text-center">Cadastro</h2>
              <input
                type="text"
                placeholder="Nome"
                value={registerName}
                onChange={e => setRegisterName(e.target.value)}
                className="border border-border rounded px-3 py-3 w-full mb-2 text-lg font-semibold text-gray-900 bg-white dark:text-white dark:bg-card"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={registerEmail}
                onChange={e => setRegisterEmail(e.target.value)}
                className="border border-border rounded px-3 py-3 w-full mb-2 text-lg font-semibold text-gray-900 bg-white dark:text-white dark:bg-card"
              />
              <input
                type="password"
                placeholder="Senha"
                value={registerPassword}
                onChange={e => setRegisterPassword(e.target.value)}
                className="border border-border rounded px-3 py-3 w-full mb-4 text-lg font-semibold text-gray-900 bg-white dark:text-white dark:bg-card"
              />
              <div className="flex gap-2">
                <Button
                  className="bg-primary text-white flex-1 text-lg font-bold py-3"
                  onClick={() => { setIsAuthenticated(true); setShowRegister(false); alert(`Cadastro: ${registerName}, ${registerEmail}`); }}
                >Cadastrar</Button>
                <Button
                  className="bg-muted text-foreground flex-1 text-lg font-bold py-3"
                  onClick={() => setShowRegister(false)}
                >Cancelar</Button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Botão de dark mode deve ficar em right-8, logo à direita do login */}
      {/* Sidebar oculto */}
      <div className="flex-1 bg-gradient-to-b from-background to-muted pt-0 min-h-0 flex flex-col">
        {/* Main Chat Area */}
        <div
          className="flex-1 overflow-y-auto chat-scrollbar px-4 py-6 space-y-4 pb-28 min-h-0 flex flex-col"
        >
          {(sessions.length === 0 || !currentSessionId) ? null : (
            sessionMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full w-full">
                <div className="mb-6 w-36 h-36 flex items-center justify-center rounded-xl bg-white/80 dark:bg-white/90 shadow">
                  <img src="/logo.png" alt="Logo UBVA" className="w-28 h-28 object-contain" />
                </div>
                <span className="text-2xl font-bold text-primary text-center">
                  Bem-vindo à Carlos-IA da UBVA!<br />
                  Seu assistente inteligente está pronto para ajudar você a transformar conversas em soluções.
                </span>
              </div>
            ) : (
              <>
                <MicrophonePermissionBanner />
                {sessionMessages.map((message, idx) => (
                  <MessageBubble key={idx} message={message} onReply={handleReply} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )
          )}
        </div>

        {/* Input fixo no fluxo, não mais position: fixed */}
        <div
          className="border border-border px-4 py-3 bg-card/90 dark:bg-card/90 flex items-center gap-3 z-30 rounded-lg shadow-xl backdrop-blur-sm transition-all duration-200 mt-2"
        >
          <Button
            onClick={handleNewSession}
            className="bg-gradient-to-r from-primary to-[#4ABF90] text-white px-2 py-1 rounded shadow text-xs"
            title="Nova Conversa"
          >
            Nova Conversa
          </Button>
          <div className="flex-1">
            {replyingTo && (
              <div className="mb-2 p-2 bg-muted/50 rounded-md border-l-4 border-primary flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">Respondendo a:</span>
                  <p className="text-sm truncate">{replyingTo.content}</p>
                </div>
                <button
                  onClick={handleCancelReply}
                  className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Cancelar resposta"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite seu pedido"
              disabled={isLoading}
              className="w-full bg-input text-foreground border border-border rounded-lg shadow-sm px-4 py-2"
            />
          </div>
          <FileUploader
            onFileSelect={setSelectedFile}
            disabled={isLoading}
            clearFile={clearFile}
          />
          <AudioRecorder
            onAudioRecorded={setSelectedAudio}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!inputMessage.trim() && !selectedFile && !selectedAudio)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm"
          >
            Enviar
          </Button>
        </div>
        {/* Rodapé institucional removido conforme solicitado */}
      </div>
    </div>
  );
}
