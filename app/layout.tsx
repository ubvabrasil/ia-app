import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { FaBroom } from 'react-icons/fa';

export const metadata: Metadata = {
  title: "Carlos IA - Chatbot Inteligente",
  description: "Assistente virtual inteligente com integração n8n",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
                  
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                }
                
                // Suprimir erros de extensões do Chrome
                const originalError = window.console.error;
                window.console.error = function(...args) {
                  const message = args[0]?.toString() || '';
                  // Ignorar erros de extensões do Chrome
                  if (message.includes('Extension context invalidated') || 
                      message.includes('chrome-extension://')) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                // Suprimir erros não tratados de extensões
                window.addEventListener('error', function(event) {
                  if (event.filename?.includes('chrome-extension://')) {
                    event.preventDefault();
                    return false;
                  }
                });
                
                window.addEventListener('unhandledrejection', function(event) {
                  const message = event.reason?.toString() || '';
                  if (message.includes('Extension context invalidated') || 
                      message.includes('chrome-extension://')) {
                    event.preventDefault();
                    return false;
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
