"use client";
// Formatação avançada do texto da assistente
function formatAssistantText(text: string) {
  if (!text) return '';

  // Função para detectar e formatar links como <a>
  const linkify = (str: string) =>
    str.replace(/(https?:\/\/[^\s<]+)/g, (match) => {
      // Detecta links do app UBVA ou webapp
      if (
        /ubva\.com\.br\/app/i.test(match) ||
        /ubva\.com\.br\/webapp/i.test(match)
      ) {
        // Nome amigável, link escondido
        if (/app/i.test(match)) {
          return `<a href="${match}" target="_blank" rel="noopener">App UBVA</a>`;
        }
        if (/webapp/i.test(match)) {
          return `<a href="${match}" target="_blank" rel="noopener">WebApp UBVA</a>`;
        }
      }
      return `<a href="${match}" target="_blank" rel="noopener">${match}</a>`;
    });

  // Função para destacar palavras-chave (sem bold)
  const highlightKeywords = (str: string) =>
    str.replace(/\b(Importante|Atenção|Dica|Nota|Cuidado|Observação|Recomendação)\b/gi, '<span style="color:#3A9C9B">$1</span>');

  // Função para destacar títulos (antes de dois pontos, sem bold)
  const highlightTitles = (str: string) =>
    str.replace(/^([^:\n]{1,40}:)/gm, '<span style="color:#3A9C9B;font-size:1.05em">$1</span>');

  // Função para listas numeradas e com marcadores
  const formatLists = (str: string) =>
    str
      .replace(/^\s*-\s+/gm, '<br/><span style="color:#3A9C9B">•</span> ')
      .replace(/^\s*\d+\.\s+/gm, (m) => `<br/><span style="color:#3A9C9B">${m.trim()}</span> `);

  // Função para destacar citações (sem borda)
  const formatQuotes = (str: string) =>
    str.replace(/^>\s*(.+)$/gm, '<blockquote style="padding-left:8px;margin:6px 0;color:#555;background:#f7faff">$1</blockquote>');

  // Função para destacar código inline
  const formatInlineCode = (str: string) =>
    str.replace(/`([^`]+)`/g, '<code style="background:#e0f0ff;color:#2d3748;padding:2px 4px;border-radius:4px;font-size:0.97em">$1</code>');

  // Função para blocos de código
  const formatCodeBlocks = (str: string) =>
    str.replace(/```([\s\S]+?)```/g, '<pre style="background:#23272f;color:#e5e7eb;padding:10px;border-radius:8px;overflow-x:auto;font-size:0.97em;margin:8px 0">$1</pre>');

  // Markdown italic (apenas dentro de frases, não tudo)
  let clean = text
    // Remover bold markdown
    .replace(/(\*\*|__)([^\*_\n]+?)\1/g, '$2')
    .replace(/(\*|_)([^\*_\n]+?)\1/g, '<em>$2</em>')
    // Remove markdown headers
    .replace(/^#+\s?/gm, '')
    // Remove horizontal lines
    .replace(/-{3,}/g, '')
    // Remove |||| e |
    .replace(/\|{2,}/g, '')
    .replace(/\s*\|\s*/g, '')
    // Limit consecutive newlines
    .replace(/\n{2,}/g, '\n')
    // Remove extra spaces
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+$/g, '').replace(/^\s+/g, '')
    // Remove isolated numbering
    .replace(/(^|<br\/?>)\d+\.\s*/g, '$1')
    // Remove 'De' at start
    .replace(/(^|<br\/?>)De\s*/gi, '$1');

  // Se o texto for apenas um link, não formate
  const isOnlyLink = /^https?:\/\/[^\s]+$/.test(clean.trim());
  if (isOnlyLink) {
    return linkify(clean.trim());
  }

  // Adiciona espaço após ponto final, interrogação ou exclamação se não houver
  clean = clean.replace(/([.?!])([^\s.?!<])/g, '$1 $2');

  // Adiciona espaço após vírgula se não houver
  clean = clean.replace(/,([^\s,<])/g, ', $1');

  // Adiciona espaço após dois pontos se não houver
  clean = clean.replace(/:([^\s:<])/g, ': $1');

  clean = formatCodeBlocks(clean);
  clean = formatInlineCode(clean);
  clean = formatQuotes(clean);
  clean = highlightTitles(clean);
  clean = formatLists(clean);

  // Quebra frases longas para legibilidade (apenas se não for link)
  clean = clean.replace(/([^.?!]{80,})([.?!])\s+(?!<)/g, '$1$2<br/>');

  // Adiciona espaço somente após ponto final (.)
  clean = clean.replace(/\.([^\s.])/g, '. $1');

  // Convert newlines to <br>
  clean = clean.replace(/\n/g, '<br/>');
  // Remove excessive <br>
  clean = clean.replace(/(<br\/?>){2,}/g, '<br/>');

  // Remove tags não permitidas
  clean = clean.replace(/<(?!br\/?|span|\/span|em|a|\/a|code|pre|blockquote|\/blockquote|\/pre|\/code)[^>]+>/g, '');

  clean = highlightKeywords(clean);
  clean = linkify(clean);

  // Remove <br/> antes e depois do texto para evitar espaçamento extra
  clean = clean.replace(/^(<br\/?>)+/, '').replace(/(<br\/?>)+$/, '');

  return clean;
}

// Componente de balão de mensagem

import { motion } from 'framer-motion';
import './ui/bubbleMessage.css';
import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { parseDbTimestamp, formatToSaoPaulo } from '@/server/datetime';
import Image from 'next/image';
import Avatar from './Avatar';
import { useMemo } from 'react';
import { FiCornerUpLeft } from 'react-icons/fi';

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
  userName?: string;
}

export function MessageBubble({ message, onReply, userName }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Efeito GIF sutil para balão da assistente
  const assistantBubbleClass = isAssistant
    ? 'bg-gradient-to-br from-[#f7faff] via-[#eaf6ff] to-[#e0f0ff] animate-bubble-gif'
    : 'bg-card text-card-foreground rounded-bl-sm';

  // Centralized date parsing/formatting for correct TZ
  const dateStr = formatToSaoPaulo(parseDbTimestamp(message.timestamp));

  // If the user just replied with their name in the chat, detect it and use it
  const looksLikeName = (text?: string) => {
    if (!text) return false;
    const t = text.trim();
    if (t.length < 2 || t.length > 60) return false;
    const words = t.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 3) return false;
    return words.every(w => /^[A-Za-zÀ-ÖØ-öø-ÿ'\-]{2,30}$/.test(w));
  };

  const displayName = isUser
    ? (userName && userName.trim().length > 0 ? userName : (looksLikeName(message.content) ? message.content.trim() : 'CLIENTE UBVA'))
    : undefined;

  // Optimize memoization for assistant text formatting
  const formattedAssistantText = useMemo(() => {
    if (isAssistant && message.contentType === 'text') {
      return formatAssistantText(message.content);
    }
    return null;
  }, [isAssistant, message.contentType, message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.03 }} // Reduced duration for faster animation
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Mostrar nome do usuário acima do balão quando disponível */}
      {isUser && (
        <div className="flex justify-end mb-1">
          <span className="text-xs text-muted-foreground mr-2">{displayName || 'CLIENTE UBVA'}</span>
        </div>
      )}
      <div className="flex items-end max-w-[80%]">
        {/* Avatar: à esquerda para assistente, à direita para usuário (estilo WhatsApp) */}
        {!isUser && (
          <div className="w-9 h-9 rounded-full overflow-hidden mr-3 flex-shrink-0">
            <Avatar variant="assistant" size={36} />
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-3 shadow-sm border border-border transition-colors duration-700 flex-1',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-[#ece5dd] dark:bg-[#3a3f45] text-[#444] dark:text-[#e5e7eb] rounded-2xl px-4 py-3 border border-border'
          )}
        >
        {/* Conteúdo de texto */}
        {message.contentType === 'text' && (
          <>
            {isAssistant ? (
              <p
                className="whitespace-pre-wrap break-words text-[0.97rem] leading-relaxed px-5 py-3 rounded-xl border border-[#e0f0ff] dark:border-[#23272f] bg-[#f3f4f6] dark:bg-[#6b7280] text-[#222] dark:text-[#f1f1f1]"
                style={{ fontFamily: 'Inter, Arial, sans-serif', margin: '0.5em 0', letterSpacing: '0.01em' }}
                dangerouslySetInnerHTML={{ __html: formattedAssistantText ?? '' }}
              />
            ) : (
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: '#888' }}>{dateStr}</span>
              {isAssistant && onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="text-xs px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors duration-200 flex items-center gap-1"
                  title="Responder a esta mensagem"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                  Responder
                </button>
              )}
            </div>
          </>
        )}

        {/* Conteúdo de imagem */}
        {message.contentType === 'image' && message.imageUrl && (
          <div className="space-y-2">
            {message.content && (
              <p className="whitespace-pre-wrap break-words mb-2">
                {message.content}
              </p>
            )}
            <div className="relative w-full max-w-sm rounded-lg overflow-hidden">
              <Image
                src={message.imageUrl}
                alt="Imagem enviada"
                width={400}
                height={300}
                className="w-full h-auto"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: '#888' }}>{dateStr}</span>
              {isAssistant && onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="text-xs px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors duration-200 flex items-center gap-1"
                  title="Responder a esta mensagem"
                >
                  <FiCornerUpLeft size={14} />
                  Responder
                </button>
              )}
            </div>
          </div>
        )}

        {/* Arquivo enviado */}
        {message.contentType === 'file' && message.fileName && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
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
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium">{message.fileName}</span>
            </div>
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: '#888' }}>{dateStr}</span>
              {isAssistant && onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="text-xs px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors duration-200 flex items-center gap-1"
                  title="Responder a esta mensagem"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                  Responder
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo de áudio */}
        {message.contentType === 'audio' && (message.audioUrl || message.audioBase64) && (
          <div className="space-y-2 min-w-[280px]">
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-3 backdrop-blur-sm">
              <audio
                controls
                className="w-full audio-player-modern"
                preload="metadata"
              >
                {(() => {
                  const src = message.audioUrl || (message.audioBase64 ? `data:${message.mimeType || 'audio/wav'};base64,${message.audioBase64}` : undefined);
                  if (src) {
                    return <source src={src} type={message.mimeType || 'audio/wav'} />;
                  }
                  return null;
                })()}
                Seu navegador não suporta a reprodução de áudio.
              </audio>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: '#888' }}>{dateStr}</span>
              {isAssistant && onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="text-xs px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors duration-200 flex items-center gap-1"
                  title="Responder a esta mensagem"
                >
                  <FiCornerUpLeft size={14} />
                  Responder
                </button>
              )}
            </div>
          </div>
        )}

        {/* Removido bloco de horário extra */}
        </div>

        {isUser && (
          <div className="w-9 h-9 rounded-full overflow-hidden ml-3 flex-shrink-0">
            <Avatar name={displayName && displayName !== 'CLIENTE UBVA' ? displayName : null} size={36} variant="user" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
