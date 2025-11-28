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
      {/* Header (fixed at top) - Modernizado */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/50 px-6 py-4 bg-card/80 backdrop-blur-xl text-card-foreground flex items-center justify-between h-20 shadow-lg shadow-primary/5">
        <div className="flex items-center space-x-4">
          {/* Logo com animação suave */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={56}
                height={56}
                className="object-contain filter drop-shadow-lg group-hover:scale-110 transition-all duration-500 brightness-110 contrast-110"
                priority
              />
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {config.chatName}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Assistente Inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SettingsModal />
          <ThemeToggle />
        </div>
      </header>

      {/* Chat Area - Modernizado */}
      <main className="flex-1 overflow-hidden pt-20 pb-16">
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

      {/* Footer - Modernizado */}
      <footer className="fixed inset-x-0 bottom-0 z-40 px-6 py-3 bg-card/80 backdrop-blur-xl border-t border-border/50 shadow-lg shadow-primary/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
            © {new Date().getFullYear()} Ubva. Todos os direitos reservados.
            <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
          </p>
        </div>
      </footer>
    </div>
  );
}

