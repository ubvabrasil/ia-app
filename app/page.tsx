'use client';

import { useChatStore } from '@/lib/store';
import { Chat } from '@/components/Chat';
import { SettingsModal } from '@/components/SettingsModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const { config, messages } = useChatStore();
  const [showHistory] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header (fixed at top) - Responsivo para mobile */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/50 px-3 sm:px-6 py-2 sm:py-4 bg-card/80 backdrop-blur-xl text-card-foreground flex items-center justify-between h-16 sm:h-20 shadow-lg shadow-primary/5">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Logo com animação suave - Responsivo */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
            <div className="relative w-12 h-12 sm:w-24 sm:h-24 md:w-32 md:h-32 flex items-center justify-center">
              <img 
                src="/logo.png?v=2" 
                alt="Logo" 
                className="object-contain filter drop-shadow-lg group-hover:scale-110 transition-all duration-500 brightness-110 contrast-110 w-full h-full"
              />
            </div>
          </div>
          
          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-heading)' }}>
              {config.chatName}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.7">Assistente Inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <SettingsModal />
          <ThemeToggle />
        </div>
      </header>

      {/* Chat Area - Responsivo */}
      <main className="flex-1 overflow-hidden pt-16 sm:pt-20 pb-12 sm:pb-16">
        {showHistory ? (
          <div className="p-6 bg-gradient-to-b from-muted/50 to-background h-full overflow-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <span className="text-primary">📜</span>
                Histórico de Mensagens
              </h2>
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className="bg-card border border-border/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm text-foreground mb-2">{msg.content}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-primary">🕐</span>
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Sem data'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Chat />
        )}
      </main>

      {/* Footer - Responsivo */}
      <footer className="fixed inset-x-0 bottom-0 z-40 px-3 sm:px-6 py-2 sm:py-3 bg-card/80 backdrop-blur-xl border-t border-border/50 shadow-lg shadow-primary/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center justify-center gap-1 sm:gap-2">
            <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
            <span className="hidden sm:inline">© {new Date().getFullYear()} Ubva. Todos os direitos reservados.</span>
            <span className="sm:hidden">© {new Date().getFullYear()} Ubva</span>
            <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
          </p>
        </div>
      </footer>
    </div>
  );
}

