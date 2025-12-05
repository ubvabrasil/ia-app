'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const endpoints = [
  { 
    method: 'GET',
    path: '/api/session', 
    desc: 'Lista todas as sessões com as últimas ~20 mensagens', 
    example: 'curl http://localhost:3000/api/session',
    category: 'Sessões'
  },
  { 
    method: 'POST',
    path: '/api/session', 
    desc: 'Criar ou atualizar uma sessão (body JSON)', 
    example: `curl -X POST -H "Content-Type: application/json" \\
  -d '{"id":"123","name":"João Silva"}' \\
  http://localhost:3000/api/session`,
    category: 'Sessões'
  },
  { 
    method: 'PUT',
    path: '/api/session', 
    desc: 'Criar/substituir sessão (idempotente)', 
    example: `curl -X PUT -H "Content-Type: application/json" \\
  -d '{"id":"123","name":"Nome Atualizado"}' \\
  http://localhost:3000/api/session`,
    category: 'Sessões'
  },
  { 
    method: 'PATCH',
    path: '/api/session', 
    desc: 'Atualizar parcialmente uma sessão', 
    example: `curl -X PATCH -H "Content-Type: application/json" \\
  -d '{"id":"123","name":"Novo nome"}' \\
  http://localhost:3000/api/session`,
    category: 'Sessões'
  },
  { 
    method: 'DELETE',
    path: '/api/session', 
    desc: 'Deletar sessão e mensagens (query ?id=... ou body JSON)', 
    example: `curl -X DELETE http://localhost:3000/api/session?id=123`,
    category: 'Sessões'
  },
  { 
    method: 'GET',
    path: '/api/session/summary', 
    desc: 'Resumo otimizado de sessões (contagem + última atividade)', 
    example: `curl http://localhost:3000/api/session/summary`,
    category: 'Sessões'
  },
  { 
    method: 'GET',
    path: '/api/session/{id}/messages', 
    desc: 'Buscar todas as mensagens de uma sessão', 
    example: `curl http://localhost:3000/api/session/123/messages`,
    category: 'Sessões'
  },
  { 
    method: 'GET',
    path: '/api/session/dates', 
    desc: 'Lista datas únicas de mensagens (YYYY-MM-DD)', 
    example: `curl http://localhost:3000/api/session/dates`,
    category: 'Sessões'
  },
  { 
    method: 'GET',
    path: '/api/message', 
    desc: 'Listar mensagens de uma sessão (query ?sessionId=...)', 
    example: `curl http://localhost:3000/api/message?sessionId=123`,
    category: 'Mensagens'
  },
  { 
    method: 'POST',
    path: '/api/message', 
    desc: 'Criar mensagem (auto-cria sessão se não existir)', 
    example: `curl -X POST -H "Content-Type: application/json" \\
  -d '{"sessionId":"123","role":"user","content":"Olá","nome_completo":"João Silva"}' \\
  http://localhost:3000/api/message`,
    category: 'Mensagens'
  },
  { 
    method: 'PATCH',
    path: '/api/message', 
    desc: 'Atualizar parcialmente uma mensagem (id + campos)', 
    example: `curl -X PATCH -H "Content-Type: application/json" \\
  -d '{"id":"msg-id","content":"Texto corrigido"}' \\
  http://localhost:3000/api/message`,
    category: 'Mensagens'
  },
  { 
    method: 'DELETE',
    path: '/api/message', 
    desc: 'Deletar mensagem por id', 
    example: `curl -X DELETE http://localhost:3000/api/message?id=msg-id`,
    category: 'Mensagens'
  },
  { 
    method: 'POST',
    path: '/api/webhook', 
    desc: 'Enviar payload enriquecido ao webhook n8n (aceita sessionId/sessionid/session_id)', 
    example: `curl -X POST -H "Content-Type: application/json" \\
  -d '{"sessionId":"123","message":"Olá","nome_completo":"João"}' \\
  http://localhost:3000/api/webhook`,
    category: 'Webhook'
  },
  { 
    method: 'HEAD',
    path: '/api/webhook', 
    desc: 'Health check do webhook (retorna 200 OK)', 
    example: `curl -I http://localhost:3000/api/webhook`,
    category: 'Webhook'
  },
  { 
    method: 'OPTIONS',
    path: '/api/webhook', 
    desc: 'CORS preflight - retorna métodos permitidos', 
    example: `curl -X OPTIONS http://localhost:3000/api/webhook`,
    category: 'Webhook'
  },
  { 
    method: 'GET',
    path: '/api/webhook/config', 
    desc: 'Ler URL do webhook configurado', 
    example: `curl http://localhost:3000/api/webhook/config`,
    category: 'Webhook'
  },
  { 
    method: 'POST',
    path: '/api/webhook/config', 
    desc: 'Salvar URL do webhook (body JSON)', 
    example: `curl -X POST -H "Content-Type: application/json" \\
  -d '{"webhookUrl":"https://n8n.example/webhook"}' \\
  http://localhost:3000/api/webhook/config`,
    category: 'Webhook'
  },
  { 
    method: 'DELETE',
    path: '/api/webhook/config', 
    desc: 'Remover configuração do webhook', 
    example: `curl -X DELETE http://localhost:3000/api/webhook/config`,
    category: 'Webhook'
  },
  { 
    method: 'GET',
    path: '/api/config', 
    desc: 'Ler configuração geral (ex.: n8n-config)', 
    example: `curl http://localhost:3000/api/config`,
    category: 'Config'
  },
  { 
    method: 'POST',
    path: '/api/config', 
    desc: 'Salvar configuração geral', 
    example: `curl -X POST -H "Content-Type: application/json" \\
  -d '{"key":"value"}' \\
  http://localhost:3000/api/config`,
    category: 'Config'
  },
];

const categories = Array.from(new Set(endpoints.map(e => e.category)));

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  POST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  PUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  PATCH: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function ApiDocsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  useEffect(() => {
    // Verificar autenticação
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header - idêntico ao dashboard */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 p-3 shadow-lg transition-all hover:shadow-primary/20 hover:shadow-2xl group">
              <svg
                className="w-6 h-6 text-primary-foreground group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                Documentação da API
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {endpoints.length} endpoints
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  REST API
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="default" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/admin/dashboard">← Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-28 pb-20">
        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {categories.map(cat => {
            const count = endpoints.filter(e => e.category === cat).length;
            return (
              <Card key={cat} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">{cat}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">endpoint{count > 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Endpoints agrupados por categoria */}
        {categories.map(category => {
          const catEndpoints = endpoints.filter(e => e.category === category);
          const isExpanded = expandedCategories.has(category);
          return (
            <section key={category} className="mb-10">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full text-left group"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                  <span className="w-1 h-6 bg-primary rounded"></span>
                  {category}
                  <svg
                    className={`w-5 h-5 ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </h2>
              </button>
              {isExpanded && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {catEndpoints.map((ep, idx) => (
                    <Card key={`${category}-${idx}`} className="border-border/50 shadow-sm hover:shadow-md transition-all hover:border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${methodColors[ep.method] || 'bg-gray-100 text-gray-700'}`}>
                            {ep.method}
                          </span>
                          <code className="text-sm font-mono text-foreground">{ep.path}</code>
                        </div>
                        <CardDescription className="text-sm">{ep.desc}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted/50 border border-border/50 p-3 rounded-md text-xs overflow-x-auto">
                          <code className="text-foreground/90">{ep.example}</code>
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* Observações finais */}
        <section className="mt-10">
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Observações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Todas as rotas retornam JSON. Use <code className="px-1.5 py-0.5 bg-muted rounded text-xs">Content-Type: application/json</code> ao enviar body.</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Operações de mutação seguem padrões REST: <code className="px-1.5 py-0.5 bg-muted rounded text-xs">POST</code> (criar), <code className="px-1.5 py-0.5 bg-muted rounded text-xs">PUT</code> (replace), <code className="px-1.5 py-0.5 bg-muted rounded text-xs">PATCH</code> (update parcial), <code className="px-1.5 py-0.5 bg-muted rounded text-xs">DELETE</code> (remover).</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-700 dark:text-green-400"><code className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-xs">POST /api/message</code> cria sessão automaticamente se não existir (útil para integrações n8n).</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-700 dark:text-blue-400"><code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-xs">POST /api/webhook</code> enriquece payload com metadados da sessão (total_messages, message_count, timestamps, etc.).</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-purple-700 dark:text-purple-400">Webhook aceita múltiplas variantes do campo sessionId: <code className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs">sessionId</code>, <code className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs">sessionid</code>, <code className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs">session_id</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-orange-700 dark:text-orange-400">Deleções (<code className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded text-xs">DELETE</code>) são <strong>permanentes</strong>. Sempre confirme antes de executar em produção.</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Para arquivos binários grandes (ex.: <code className="px-1.5 py-0.5 bg-muted rounded text-xs">audioBase64</code>), verifique limites de payload do servidor/proxy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Coleção Postman e script curl estão disponíveis em <code className="px-1.5 py-0.5 bg-muted rounded text-xs">docs/postman_collection.json</code> e <code className="px-1.5 py-0.5 bg-muted rounded text-xs">docs/http_examples.sh</code>.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
