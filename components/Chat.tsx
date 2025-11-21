"use client";
// Componente principal do Chat

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { N8nService } from '@/lib/n8n-service';
import { getWebhookConfig } from '@/lib/webhook-config';
import { MessageBubble } from './MessageBubble';
import Avatar from './Avatar';
import { FileUploader } from './FileUploader';
import { AudioRecorder } from './AudioRecorder';
import { MicrophonePermissionBanner } from './MicrophonePermissionBanner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { WebGlassDownload } from './WebGlassDownload';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { Message } from '@/lib/types';
import { sendWebhookEvent } from '@/lib/webhook-config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { MdAdd,MdSend,MdPerson,MdClose,MdShoppingCart,MdArrowDownward } from 'react-icons/md';

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
          {/* Usando react-icons */}
          <span className="text-white">
        <MdAdd size={28} />
          </span>
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
  // Estado para mostrar 'digitando...'
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  // Efeito de digitação para respostas da assistente
  const [typing, setTyping] = useState(false);
  const [typedContent, setTypedContent] = useState('');
  // Aliases para efeito de digitação
  const typingText = typedContent;
  const assistantTyping = typedContent;
  // Velocidade de digitação em milissegundos
  const typingSpeed = 30;

  // Função para efeito de digitação (determinística)
  const typeEffect = (fullText: string, callback?: () => void) => {
    setShowTypingIndicator(false); // Disable typing indicator immediately
    setTypedContent(fullText); // Render the full response instantly
    if (callback) callback();
  };

  // Check localStorage for accepted policy on mount
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAcceptedPolicy(localStorage.getItem('policyAccepted') === 'true');
    }
  }, []);
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
  const [showIdentificationModal, setShowIdentificationModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Container ref to compute scroll position and avoid aggressive scrollIntoView on mobile
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  // Allow user to lock auto-scroll when they want to read older messages
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  // Track previous messages length to only scroll when new messages arrive
  const lastMessagesLengthRef = useRef<number>(0);
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

  // Scroll automático para última mensagem (guardado)
  useEffect(() => {
    try {
      const container = messagesContainerRef.current;
      const shouldScroll = autoScrollEnabled && messages.length > lastMessagesLengthRef.current;
      if (!shouldScroll) {
        lastMessagesLengthRef.current = messages.length;
        return;
      }

      // If container exists, check whether user is near bottom (within 200px)
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
        if (distanceFromBottom < 200) {
          // Use 'auto' on mobile for immediate jump, 'smooth' otherwise
          const behavior = /Mobi|Android/i.test(navigator.userAgent) ? 'auto' : 'smooth';
          messagesEndRef.current?.scrollIntoView({ behavior: behavior as ScrollBehavior });
        }
      } else {
        // Fallback: scroll target element
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      lastMessagesLengthRef.current = messages.length;
    } catch (e) {
      console.debug('scroll handling error', e);
    }
  }, [messages, showTypingIndicator, typing, autoScrollEnabled]);

  useEffect(() => {
    if (!typing) {
      const inputBox = document.querySelector('input[placeholder="Digite seu pedido"]');
      if (inputBox) {
        (inputBox as HTMLInputElement).focus();
      }
    }
  }, [typing]);

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
    // Enviar evento webhook conforme configuração
    sendWebhookEvent('SEND_MESSAGE', fullMessage);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile && !selectedAudio) return;
    setLoading(true);
    try {
      const webhookConfig = await getWebhookConfig();
      // Accept multiple shapes returned by the admin panel / DB
      const webhookUrl = webhookConfig?.baseUrl || webhookConfig?.webhook?.baseUrl || webhookConfig?.webhookUrl || webhookConfig?.webhook?.url || webhookConfig?.webhook?.baseUrl || null;
      console.log('Resolved webhook config:', webhookConfig, '=> webhookUrl:', webhookUrl);
      if (!webhookUrl) {
        alert('Configure o webhook do n8n no painel de webhook antes de enviar mensagens');
        return;
      }
      const service = new N8nService({ ...config, webhookUrl });
      if (selectedAudio) {
        // Enviar áudio (usar .mp3 quando possível)
        const inferredType = selectedAudio.type || '';
        const fileName = inferredType.includes('mpeg') || inferredType.includes('mp3') ? 'audio.mp3' : 'audio.mp3';
        const audioFile = new File([selectedAudio], fileName, { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(selectedAudio);
        addMessageAndBroadcast({
          role: 'user',
          content: inputMessage || 'Áudio enviado',
          contentType: 'audio',
          audioUrl: audioUrl,
          sessionId: currentSessionId,
          replyTo: replyingTo?.id,
        });
        let response = await service.sendFile(audioFile, inputMessage);
        // Fallback: if direct webhook call failed due to network/CORS, try server-side proxy
        if (response?.error && typeof window !== 'undefined') {
          try {
            const prox = await fetch('/api/n8n-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ webhookUrl, file: await audioFile.arrayBuffer(), fileName: audioFile.name, fileType: audioFile.type, message: inputMessage, session_id: currentSessionId }),
            });
            const proxData = await prox.json();
            response = proxData;
          } catch (err) {
            console.error('Fallback proxy failed:', err);
          }
        }
        handleN8nResponse(response);
        setSelectedAudio(null);
        setInputMessage('');
      } else if (selectedFile) {
        const isImage = selectedFile.type.startsWith('image/');
        let imageBase64: string | undefined = undefined;
        if (isImage) {
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
        }
        addMessageAndBroadcast({
          role: 'user',
          content: inputMessage || 'Arquivo enviado',
          contentType: isImage ? 'image' : 'file',
          imageUrl: isImage ? imageBase64 : undefined,
          fileName: !isImage ? selectedFile.name : undefined,
          sessionId: currentSessionId,
          replyTo: replyingTo?.id,
        });
        let response = await service.sendFile(selectedFile, inputMessage);
        if (response?.error && typeof window !== 'undefined') {
          try {
            const prox = await fetch('/api/n8n-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ webhookUrl, file: await selectedFile.arrayBuffer(), fileName: selectedFile.name, fileType: selectedFile.type, message: inputMessage, session_id: currentSessionId }),
            });
            const proxData = await prox.json();
            response = proxData;
          } catch (err) {
            console.error('Fallback proxy failed:', err);
          }
        }
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
        let response = await service.sendMessage(inputMessage);
        if (response?.error && typeof window !== 'undefined') {
          try {
            const prox = await fetch('/api/n8n-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ webhookUrl, message: inputMessage, session_id: currentSessionId }),
            });
            const proxData = await prox.json();
            response = proxData;
          } catch (err) {
            console.error('Fallback proxy failed:', err);
          }
        }
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

  const handleN8nResponse = async (response: any) => {
    try {
      console.debug('handleN8nResponse - raw response:', response);
      if (!response) {
        const msg = 'Nenhuma resposta recebida do n8n.';
        typeEffect(msg, () => {
          addMessageAndBroadcast({ role: 'assistant', content: msg, contentType: 'text', sessionId: currentSessionId });
        });
        return;
      }

      if (response.error) {
        const errMsg = typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
        typeEffect(errMsg, () => {
          addMessageAndBroadcast({ role: 'assistant', content: errMsg, contentType: 'text', sessionId: currentSessionId });
        });
        return;
      }

      // Helper to robustly extract text from many possible payload shapes
      const extractText = (res: any): string | null => {
        if (!res) return null;
        if (typeof res === 'string') return res;
        if (typeof res === 'object') {
          // common fields
          if (res.output && typeof res.output === 'string') return res.output;
          if (res.content && typeof res.content === 'string') return res.content;
          if (res.text && typeof res.text === 'string') return res.text;
          if (res.Resposta && typeof res.Resposta === 'string') return res.Resposta;
          if (res.answer && typeof res.answer === 'string') return res.answer;
          // array responses
          if (Array.isArray(res) && res.length > 0) {
            const first = res[0];
            if (first.output && typeof first.output === 'string') return first.output;
            if (first.content && typeof first.content === 'string') return first.content;
          }
          // nested data
          if (res.data) return extractText(res.data);
        }
        return null;
      };

      // Image handling
      if (response.type === 'image' && (response.url || response.imageUrl)) {
        let imageUrl = response.url || response.imageUrl;
        if (typeof imageUrl === 'string' && imageUrl.startsWith('blob:')) {
          try {
            const blob = await fetch(imageUrl).then(r => r.blob());
            imageUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (err) {
            console.error('Erro ao converter blob para base64:', err);
          }
        }
        addMessageAndBroadcast({ role: 'assistant', content: response.content || '', contentType: 'image', imageUrl, sessionId: currentSessionId });
        return;
      }

      const text = extractText(response) || 'Resposta recebida do n8n (formato inesperado).';
      typeEffect(text, () => {
        addMessageAndBroadcast({ role: 'assistant', content: text, contentType: 'text', sessionId: currentSessionId });
      });
    } catch (err) {
      console.error('Erro em handleN8nResponse:', err, 'response:', response);
      addMessageAndBroadcast({ role: 'assistant', content: 'Erro interno ao processar resposta do n8n.', contentType: 'text', sessionId: currentSessionId });
    }
  };

  // Sidebar session management
  const handleNewSession = () => {
  const newSessionId = uuidv4();
  addSession(newSessionId);
  setCurrentSession(newSessionId);
  clearSessionMessages(newSessionId);
  };

  // Check localStorage for accepted policy on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const policyAccepted = localStorage.getItem('policyAccepted') === 'true';
      setAcceptedPolicy(policyAccepted);
    }
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --bold-text-color-light: #000;
        --bold-text-color-dark: #fff;
      }
      span[style*="font-weight: bold"] {
        color: var(--bold-text-color-light) !important;
      }
      .dark span[style*="font-weight: bold"] {
        color: var(--bold-text-color-dark) !important;
      }

      @media (max-width: 414px) {
        .new-conversation-button {
          width: 40px;
          height: 40px;
          font-size: 0;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--primary-color);
          border-radius: 50%;
          position: relative;
        }
        .new-conversation-button::before {
          content: '+';
          font-size: 24px;
          color: white;
          font-weight: bold;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      }
    `;
    document.head.appendChild(style);
    // additional keyframes for formatting dots animation
    const extra = document.createElement('style');
    extra.innerHTML = `
      .formatting-dots { display: inline-flex; align-items: center; gap: 6px; }
  .formatting-dots span { width: 8px; height: 8px; background: rgba(14,165,233,0.95); border-radius: 9999px; display: inline-block; opacity: 0.95; }
      .formatting-dots span.dot-1 { animation: dot 1s infinite; animation-delay: 0s; }
      .formatting-dots span.dot-2 { animation: dot 1s infinite; animation-delay: 0.12s; }
      .formatting-dots span.dot-3 { animation: dot 1s infinite; animation-delay: 0.24s; }
      @keyframes dot { 0% { transform: translateY(0); opacity: 0.5 } 50% { transform: translateY(-6px); opacity: 1 } 100% { transform: translateY(0); opacity: 0.5 } }

      /* Assistant avatar subtle thinking pulse */
      .assistant-avatar { border-radius: 9999px; box-shadow: 0 0 0 rgba(59,130,246,0.0); }
      .assistant-avatar.pulsing { animation: assistant-pulse 1.6s infinite; }
      @keyframes assistant-pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0.15); }
        50% { transform: scale(1.06); box-shadow: 0 6px 18px 6px rgba(59,130,246,0.08); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
      }
    `;
    document.head.appendChild(extra);

    return () => {
      document.head.removeChild(style);
      document.head.removeChild(extra);
    };
  }, []);

  const handleIdentificationSubmit = async () => {
    if (userName.trim() && whatsappNumber.trim()) {
      const sessionData = {
        id: currentSessionId,
        nome_completo: userName,
        remote_jid: whatsappNumber,
      };
      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        });
        if (!response.ok) {
          throw new Error('Failed to save session data');
        }
        console.log('User details saved:', sessionData);
        // Salvar localmente para anexar às mensagens posteriores
        try {
          localStorage.setItem('userName', sessionData.nome_completo);
          localStorage.setItem('whatsappNumber', sessionData.remote_jid);
          // identification answered, no longer awaiting a name
          localStorage.removeItem('awaitingName');
        } catch (e) {
          // localStorage pode falhar em ambientes de SSR; ignorar
        }
        // Atualizar o estado local com o nome
        setUserName(sessionData.nome_completo);
      } catch (error) {
        console.error('Error saving user details:', error);
      }
      // Close the modal
      setShowIdentificationModal(false);
    } else {
      alert('Por favor, preencha todos os campos ou continue como anônimo.');
    }
  };

  // Check accepted policy state before rendering modals
  useEffect(() => {
    // When policy is accepted, decide whether to show identification modal.
    // Show it only if there is no saved identity (userName or whatsappNumber) for the current session.
    if (acceptedPolicy) {
      try {
        const storedName = localStorage.getItem('userName');
        const storedNumber = localStorage.getItem('whatsappNumber');
        if (!storedName && !storedNumber) {
          setShowIdentificationModal(true);
          try { localStorage.setItem('awaitingName', 'true'); } catch (e) { /* ignore */ }
        } else {
          setUserName(storedName || '');
          setWhatsappNumber(storedNumber || '');
          setShowIdentificationModal(false);
          try { localStorage.removeItem('awaitingName'); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        // If localStorage is not available, still show the modal so the user can identify
        setShowIdentificationModal(true);
      }
    } else {
      setShowIdentificationModal(false);
    }
  }, [acceptedPolicy, currentSessionId]);

  // If messages change and a name was saved by the store (localStorage), close the identification modal
  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName');
      const storedNumber = localStorage.getItem('whatsappNumber');
      if (storedName) {
        setUserName(storedName);
        setWhatsappNumber(storedNumber || '');
        setShowIdentificationModal(false);
        try { localStorage.removeItem('awaitingName'); } catch (e) { /* ignore */ }
        // Ensure server session is updated with the stored identity (safe idempotent call)
        (async () => {
          try {
            await fetch('/api/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: currentSessionId, nome_completo: storedName, remote_jid: storedNumber || undefined }),
            });
          } catch (e) {
            // ignore
          }
        })();
      }
    } catch (e) {
      // ignore
    }
  }, [messages, currentSessionId]);

  // Add state for WebGlass modal visibility
  const [showWebGlassModal, setShowWebGlassModal] = useState(false);

  return (
    <div className="flex h-full w-full pl-0">
      {/* Render privacy modal first */}
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

      {/* Identification modal appears only after privacy is accepted */}
      {acceptedPolicy && showIdentificationModal && (
        <Dialog open={showIdentificationModal} onOpenChange={setShowIdentificationModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Identifique-se</DialogTitle>
              <DialogDescription>
                Por favor, insira seu nome completo e número do WhatsApp para continuar ou prossiga como anônimo.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <input
              type="text"
              placeholder="Nome completo (opcional)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="border border-border rounded px-3 py-2 w-full"
              />
              <input
              type="text"
              placeholder="Número do WhatsApp (opcional)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="border border-border rounded px-3 py-2 w-full"
              />
              <span className="text-xs text-muted-foreground">
              Você pode preencher apenas os campos, se preferir.
              </span>
            </div>
            <DialogFooter>
              <button
                onClick={handleIdentificationSubmit}
                className="bg-primary text-white px-4 py-2 rounded-md"
              >
                Continuar
              </button>
              <button
                onClick={async () => {
                  // Mark as anonymous and persist so admin sees this session as anonymous
                  const anonName = 'CLIENTE UBVA';
                  try {
                    localStorage.setItem('userName', anonName);
                    localStorage.removeItem('awaitingName');
                  } catch (e) {
                    // ignore localStorage errors
                  }
                  setUserName(anonName);
                  // Persist to server so session shows as anonymous
                  try {
                    await fetch('/api/session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: currentSessionId, nome_completo: anonName }),
                    });
                  } catch (e) {
                    // ignore network errors here
                  }
                  setShowIdentificationModal(false);
                }}
                className="bg-muted text-foreground px-4 py-2 rounded-md"
              >
                Continuar como anônimo
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            {/* React-icons user/avatar icon */}
            <span className="text-primary">
              <MdAdd size={28} style={{ display: 'none' }} /> {/* hidden, just for import */}
              {/* Use MdPerson from react-icons/md */}
              <MdPerson size={28} />
            </span>
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
          ref={messagesContainerRef}
        >
          {(sessions.length === 0 || !currentSessionId) ? null : (
            sessionMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full w-full pt-8 pb-4">
          <div className="mb-2 w-28 h-28 flex items-center justify-center rounded-xl bg-white/80 dark:bg-white/90 shadow hidden sm:flex">
            <img src="/logo.png" alt="Logo UBVA" className="w-20 h-20 object-contain" />
          </div>
          <span className="text-xl font-bold text-primary text-center mb-2">
            Bem-vindo à Carlos-IA da UBVA!<br />
            <span className="text-base font-normal text-muted-foreground">Seu assistente inteligente está pronto para ajudar você a transformar conversas em soluções.</span>
          </span>
          <div className="flex flex-col items-center gap-2 mt-4 w-full max-w-lg">
            <span className="text-base font-semibold text-muted-foreground mb-1">Sugestões rápidas:</span>
            <button
              className="bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-lg shadow font-medium text-base w-full transition-colors"
              onClick={async () => {
                const pergunta = 'Sugira os melhores tipos de vidro para projetos arquitetônicos';
                addMessageAndBroadcast({
            role: 'user',
            content: pergunta,
            contentType: 'text',
            sessionId: currentSessionId,
                });
                setLoading(true);
                try {
            const webhookConfig = await getWebhookConfig();
            const webhookUrl = webhookConfig?.baseUrl || webhookConfig?.webhook?.baseUrl || webhookConfig?.webhookUrl || webhookConfig?.webhook?.url || webhookConfig?.webhook?.baseUrl || null;
            if (!webhookUrl) {
              alert('Configure o webhook do n8n no painel de webhook antes de enviar mensagens');
              return;
            }
            const service = new N8nService({ ...config, webhookUrl });
            let response = await service.sendMessage(pergunta);
            if (response?.error && typeof window !== 'undefined') {
              try {
                const prox = await fetch('/api/n8n-proxy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ webhookUrl, message: pergunta, session_id: currentSessionId }),
                });
                const proxData = await prox.json();
                response = proxData;
              } catch (err) {
                console.error('Fallback proxy failed:', err);
              }
            }
            handleN8nResponse(response);
                } finally {
            setLoading(false);
                }
              }}
            >
              Sugira os melhores tipos de vidro para projetos arquitetônicos
            </button>
            <button
              className="bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-lg shadow font-medium text-base w-full transition-colors"
              onClick={async () => {
                const pergunta = 'Quais são as práticas mais comuns de sustentabilidade na produção de vidro no Brasil';
                addMessageAndBroadcast({
            role: 'user',
            content: pergunta,
            contentType: 'text',
            sessionId: currentSessionId,
                });
                setLoading(true);
                try {
            const webhookConfig = await getWebhookConfig();
            const webhookUrl = webhookConfig?.baseUrl || webhookConfig?.webhook?.baseUrl || webhookConfig?.webhookUrl || webhookConfig?.webhook?.url || webhookConfig?.webhook?.baseUrl || null;
            if (!webhookUrl) {
              alert('Configure o webhook do n8n no painel de webhook antes de enviar mensagens');
              return;
            }
            const service = new N8nService({ ...config, webhookUrl });
            let response = await service.sendMessage(pergunta);
            if (response?.error && typeof window !== 'undefined') {
              try {
                const prox = await fetch('/api/n8n-proxy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ webhookUrl, message: pergunta, session_id: currentSessionId }),
                });
                const proxData = await prox.json();
                response = proxData;
              } catch (err) {
                console.error('Fallback proxy failed:', err);
              }
            }
            handleN8nResponse(response);
                } finally {
            setLoading(false);
                }
              }}
            >
              Quais são as práticas mais comuns de sustentabilidade na produção de vidro no Brasil
            </button>
            <button
              className="bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-lg shadow font-medium text-base w-full transition-colors"
              onClick={async () => {
                const pergunta = 'Explique como funciona o processo de manufatura de vidro plano e quais as suas principais aplicações no mercado brasileiro?';
                addMessageAndBroadcast({
            role: 'user',
            content: pergunta,
            contentType: 'text',
            sessionId: currentSessionId,
                });
                setLoading(true);
                try {
            const webhookConfig = await getWebhookConfig();
            const webhookUrl = webhookConfig?.baseUrl || webhookConfig?.webhook?.baseUrl || webhookConfig?.webhookUrl || webhookConfig?.webhook?.url || webhookConfig?.webhook?.baseUrl || null;
            if (!webhookUrl) {
              alert('Configure o webhook do n8n no painel de webhook antes de enviar mensagens');
              return;
            }
            const service = new N8nService({ ...config, webhookUrl });
            let response = await service.sendMessage(pergunta);
            if (response?.error && typeof window !== 'undefined') {
              try {
                const prox = await fetch('/api/n8n-proxy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ webhookUrl, message: pergunta, session_id: currentSessionId }),
                });
                const proxData = await prox.json();
                response = proxData;
              } catch (err) {
                console.error('Fallback proxy failed:', err);
              }
            }
            handleN8nResponse(response);
                } finally {
            setLoading(false);
                }
              }}
            >
              Explique como funciona o processo de manufatura de vidro plano e quais as suas principais aplicações no mercado brasileiro?
            </button>
          </div>
          <WebGlassDownload />
              </div>
            ) : (
              <>
          {sessionMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onReply={handleReply}
              userName={userName}
            />
          ))}
          {/* Animated indicator while IA está formatando a resposta */}
          {(showTypingIndicator || typing) && (
            <div className="flex w-full mb-4 justify-start">
              <div className="flex items-start gap-3">
                <div className={`assistant-avatar ${showTypingIndicator || typing ? 'pulsing' : ''}`} aria-hidden>
            <Avatar variant="assistant" size={40} />
                </div>
                <div className="max-w-[60%] rounded-2xl px-4 py-3 shadow-sm border border-border bg-gradient-to-br from-[#f7faff] via-[#eaf6ff] to-[#e0f0ff]">
            <div className="flex items-center gap-3">
              <div className="formatting-dots" aria-hidden>
                <span className="dot-1" />
                <span className="dot-2" />
                <span className="dot-3" />
              </div>
              <div className="text-sm text-slate-700 dark:text-zinc-200"></div>
            </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
              </>
            )
          )}
        </div>
            {/* Input fixo no fluxo, não mais position: fixed */}
            <div
            className="sticky bottom-0 left-0 right-0 border border-border px-4 py-3 bg-card/90 dark:bg-card/90 flex items-center gap-3 z-30 rounded-lg shadow-xl backdrop-blur-sm transition-all duration-200 mt-2"
            style={{ boxShadow: '0 -2px 16px 0 rgba(0,0,0,0.08)' }}
            >
            <Button
              onClick={handleNewSession}
              className="bg-gradient-to-r from-primary to-[#4ABF90] text-white px-2 py-1 rounded shadow text-xs new-conversation-button"
              title="Nova Conversa"
            >
              Nova Conversa
            </Button>
            <div className="flex-1">
              {replyingTo && (
              <div className="mb-2 p-2 bg-muted/50 rounded-md border-l-4 border-primary flex items-center justify-between">
                <div className="flex-1">
                <span className="text-xs text-muted-foreground">Respondendo a:</span>
                <p className="text-sm truncate">
                  {replyingTo.content?.length > 40
                  ? replyingTo.content.slice(0, 40) + '...'
                  : replyingTo.content}
                </p>
                </div>
                <button
                onClick={handleCancelReply}
                className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Cancelar resposta"
                >
                <MdClose size={16} />
                </button>
              </div>
              )}
              <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm flex items-center justify-center"
            >
              <span className="block md:hidden">
              <span className="text-white">
                <MdSend size={22} />
              </span>
              </span>
              <span className="hidden md:block">
              Enviar
              </span>
            </Button>
            </div>
        {/* Rodapé institucional removido conforme solicitado */}
      </div>
    </div>
  );
}
