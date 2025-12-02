"use client";

import { memo, useMemo, useState, useEffect } from 'react';
import { Message } from '@/lib/types';
import { FiLoader } from 'react-icons/fi';

// Formatação avançada do texto da assistente
function formatAssistantText(text: string) {
  if (!text) return '';

  // PRIMEIRO: Detectar se é HTML completo do n8n (DOCTYPE, <html>, etc)
  // Se for, retornar SEM NENHUMA modificação
  const isFullHtml = /<!DOCTYPE\s+html>|<html[^>]*>/i.test(text);
  if (isFullHtml) {
    // Retornar HTML completo exatamente como veio
    return text;
  }

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

  // Função para detectar e converter imagens base64 em tags <img>
  const convertBase64Images = (str: string) => {
    // Detectar padrões de base64 de imagem
    return str.replace(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g, (match) => {
      return `<br/><img src="${match}" alt="Imagem" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" /><br/>`;
    });
  };

  // Função para processar tags <img> com templates do n8n
  const processImageTags = (str: string) => {
    // Detectar e processar tags <img> independente do src
    // Adicionar estilos padrão se não tiver
    return str.replace(/<img([^>]*)>/gi, (match, attributes) => {
      // Verificar se já tem style
      if (!/style\s*=/i.test(attributes)) {
        // Adicionar estilos padrão
        return `<img${attributes} style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;">`;
      }
      // Se já tiver style, manter original
      return match;
    });
  };

  // Função para processar blocos HTML/CSS do n8n (como botões, cards, etc)
  const processHtmlBlocks = (str: string) => {
    // Detectar padrões como: return [{ html: <style>...</style><a>...</a> }];
    // Extrair apenas o conteúdo HTML útil
    let processed = str;
    
    // Padrão 1: return [{ html: ... }];
    const htmlArrayPattern = /return\s*\[\s*\{\s*html:\s*(.+?)\s*\}\s*\];?/gi;
    processed = processed.replace(htmlArrayPattern, (match, htmlContent) => {
      return htmlContent.trim();
    });
    
    // Padrão 2: Detectar blocos <style>...</style> e manter separados
    const stylePattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styles: string[] = [];
    processed = processed.replace(stylePattern, (match, styleContent) => {
      styles.push(styleContent.trim());
      return ''; // Remove temporariamente
    });
    
    // Recolocar estilos no início se houver
    if (styles.length > 0) {
      const styleBlock = `<style>${styles.join('\n')}</style>`;
      processed = styleBlock + processed;
    }
    
    return processed;
  };

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

  // Remove tags não permitidas (agora permitindo img, style, div, a)
  clean = clean.replace(/<(?!br\/?|span|\/span|em|a|\/a|code|pre|blockquote|\/blockquote|\/pre|\/code|img|style|\/style|div|\/div)[^>]+>/g, '');

  clean = processHtmlBlocks(clean);
  clean = highlightKeywords(clean);
  clean = linkify(clean);
  clean = convertBase64Images(clean);
  clean = processImageTags(clean);

  // Remove <br/> antes e depois do texto para evitar espaçamento extra
  clean = clean.replace(/^(<br\/?>)+/, '').replace(/(<br\/?>)+$/, '');

  return clean;
}

// Componente de balão de mensagem

import { motion } from 'framer-motion';
import './ui/bubbleMessage.css';
import { cn } from '@/lib/utils';
import { parseDbTimestamp, formatToSaoPaulo } from '@/server/datetime';
import Image from 'next/image';
import Avatar from './Avatar';
import { FiCornerUpLeft } from 'react-icons/fi';

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
  userName?: string;
}

function MessageBubbleComponent({ message, onReply, userName }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Centralized date parsing/formatting for correct TZ
  const dateStr = formatToSaoPaulo(parseDbTimestamp(message.timestamp));

  // Detectar se o conteúdo é uma imagem base64
  const isBase64Image = useMemo(() => {
    if (!message.content) return false;
    const trimmed = message.content.trim();
    return /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(trimmed);
  }, [message.content]);

  // Se detectar base64 de imagem, extrair apenas a parte base64
  const imageData = useMemo(() => {
    if (!isBase64Image) return null;
    return message.content.trim();
  }, [isBase64Image, message.content]);

  // Truncar mensagens muito longas para evitar overflow (não aplicar a imagens base64)
  const MAX_LENGTH = 2000; // Reduzido para mobile
  const truncatedContent = useMemo(() => {
    if (!message.content) return '';
    if (isBase64Image) return ''; // Não mostrar base64 como texto
    if (message.content.length <= MAX_LENGTH) return message.content;
    return message.content.substring(0, MAX_LENGTH) + '... [mensagem muito longa]';
  }, [message.content, isBase64Image]);

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
    ? (userName && userName.trim().length > 0 ? userName : (looksLikeName(truncatedContent) ? truncatedContent.trim() : 'CLIENTE UBVA'))
    : undefined;

  // Optimize memoization for assistant text formatting
  const formattedAssistantText = useMemo(() => {
    if (isAssistant && message.contentType === 'text' && !isBase64Image) {
      return formatAssistantText(truncatedContent);
    }
    return null;
  }, [isAssistant, message.contentType, truncatedContent]);

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
      <div className={cn('flex items-end', isUser ? 'max-w-[75%] sm:max-w-[65%] md:max-w-[55%]' : 'max-w-[75%] sm:max-w-[65%] md:max-w-[55%]')}>
        {/* Avatar: apenas para assistente */}
        {!isUser && (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden mr-2 sm:mr-3 flex-shrink-0">
            <Avatar variant="assistant" size={36} />
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-border transition-colors duration-700 inline-block',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-[#ece5dd] dark:bg-[#3a3f45] text-[#444] dark:text-[#e5e7eb] border border-border'
          )}
        >
        {/* Conteúdo de texto */}
        {message.contentType === 'text' && !isBase64Image && (
          <>
            {isAssistant ? (
              <p
                className="break-words text-sm sm:text-[0.97rem] leading-relaxed px-2 sm:px-5 py-2 sm:py-3 rounded-xl border border-[#e0f0ff] dark:border-[#23272f] bg-[#f3f4f6] dark:bg-[#6b7280] text-[#222] dark:text-[#f1f1f1]"
                style={{ 
                  fontFamily: 'Inter, Arial, sans-serif', 
                  margin: '0.5em 0', 
                  letterSpacing: '0.01em',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}
                dangerouslySetInnerHTML={{ __html: formattedAssistantText ?? '' }}
              />
            ) : (
              <p 
                className="break-words text-sm sm:text-base" 
                style={{ 
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}
              >
                {truncatedContent}
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

        {/* Conteúdo quando é base64 de imagem no texto */}
        {isBase64Image && imageData && (
          <div className="space-y-2">
            <div className="relative w-full max-w-xs sm:max-w-sm rounded-lg overflow-hidden">
              <img
                src={imageData}
                alt="Imagem enviada"
                className="w-full h-auto rounded-lg"
                loading="lazy"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: '#888' }}>{dateStr}</span>
            </div>
          </div>
        )}

        {/* Conteúdo de imagem (imageUrl) */}
        {message.contentType === 'image' && message.imageUrl && (
          <div className="space-y-2">
            {message.content && (
              <p className="break-words text-sm sm:text-base mb-2">
                {message.content}
              </p>
            )}
            <div className="relative w-full max-w-xs sm:max-w-sm rounded-lg overflow-hidden">
              <img
                src={message.imageUrl}
                alt="Imagem enviada"
                className="w-full h-auto rounded-lg"
                loading="lazy"
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
        {message.contentType === 'audio' && (message.audioUrl || (message as any).audioBase64) && (
          <AudioMessage 
            message={message} 
            dateStr={dateStr} 
            isAssistant={isAssistant}
            onReply={onReply}
          />
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

// Export memoizado com comparação otimizada
export const MessageBubble = memo(MessageBubbleComponent, (prevProps, nextProps) => {
  // Otimização: apenas re-renderizar se a mensagem mudou
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.onReply === nextProps.onReply
  );
});

// Componente separado para mensagens de áudio com transcrição automática
function AudioMessage({ message, dateStr, isAssistant, onReply }: {
  message: Message;
  dateStr: string;
  isAssistant: boolean;
  onReply?: (msg: Message) => void;
}) {
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);

  const audioBase64 = (message as any).audioBase64;
  const audioSrc = audioBase64 || message.audioUrl;

  // Transcrição automática quando o componente é montado
  useEffect(() => {
    if (audioBase64 && !transcription && !transcribing) {
      handleTranscribe();
    }
  }, [audioBase64]);

  const handleTranscribe = async () => {
    if (!audioBase64 || transcribing) return;
    
    setTranscribing(true);
    
    try {
      // Converter base64 para blob
      let audioBlob: Blob;
      
      if (audioBase64.startsWith('data:')) {
        // É base64 completo com data URI
        const response = await fetch(audioBase64);
        audioBlob = await response.blob();
      } else {
        // É base64 sem prefixo, adicionar prefixo
        const mimeType = (message as any).mimeType || 'audio/mpeg';
        const dataUri = `data:${mimeType};base64,${audioBase64}`;
        const response = await fetch(dataUri);
        audioBlob = await response.blob();
      }

      // Criar FormData para enviar ao Groq
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.mp3');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'pt');
      formData.append('response_format', 'json');

      const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
      if (!groqApiKey) {
        throw new Error('GROQ API Key não configurada');
      }

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na transcrição: ${errorText}`);
      }

      const data = await response.json();
      setTranscription(data.text || 'Não foi possível transcrever o áudio.');
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      setTranscription('Erro ao transcrever áudio.');
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="space-y-2 min-w-[280px]">
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-3 backdrop-blur-sm">
        <audio
          controls
          className="w-full audio-player-modern"
          preload="metadata"
        >
          <source src={audioSrc} type="audio/mpeg" />
          <source src={audioSrc} type="audio/wav" />
          <source src={audioSrc} type="audio/webm" />
          Seu navegador não suporta a reprodução de áudio.
        </audio>

        {/* Mostrar transcrição automática */}
        {transcribing && (
          <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs text-muted-foreground border border-border/50 flex items-center gap-2">
            <FiLoader className="animate-spin" size={14} />
            <span>Transcrevendo áudio...</span>
          </div>
        )}

        {transcription && !transcribing && (
          <div className="mt-2 p-2 bg-primary/10 rounded-md text-xs border border-primary/20">
            <strong className="text-foreground">📝 Transcrição:</strong>
            <p className="mt-1 text-foreground/80">{transcription}</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs" style={{ color: '#888' }}>{dateStr}</span>
        {isAssistant && onReply && (
          <button
            onClick={() => onReply(message)}
            className="text-xs px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors duration-200 flex items-center gap-1"
            title="Responder a esta mensagem"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Responder
          </button>
        )}
      </div>
    </div>
  );
}
