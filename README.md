# 🎨 ChatGPT Clone com Integração n8n

Site estilo ChatGPT totalmente funcional com integração direta ao n8n para processamento de mensagens e arquivos.

## ✨ Características

- 💬 Interface de chat moderna e responsiva
- 🌓 Tema dark/light com alternância
- 📤 Upload de arquivos (imagens, PDFs, documentos)
- 🔗 Integração completa com webhooks n8n
- 💾 Persistência de histórico e configurações
- ⚡ Scroll automático e indicador de digitação
- 🎯 Preview de imagens antes do envio
- 🔐 Suporte a autenticação por token

## 🚀 Como Usar

### 1. Iniciar o projeto

```bash
npm install
npm run dev
```

O site estará disponível em `http://localhost:3000`

### 2. Configurar o n8n

1. Clique no ícone de **configurações** (⚙️) no canto superior direito
2. Preencha os campos:
   - **Webhook URL do n8n**: URL do seu webhook (ex: `https://seu-n8n.com/webhook/chat`)
   - **Token de Autenticação** (opcional): Bearer token se necessário
   - **Nome do Chat**: Personalize o título do chat

### 3. Criar o Workflow no n8n

Configure um webhook no n8n que receba requisições no formato:

```json
{
  "message": "texto da mensagem",
  "file": "base64_do_arquivo",
  "fileName": "documento.pdf",
  "fileType": "application/pdf",
  "session_id": "uuid-da-sessao"
}
```

E retorne uma resposta no formato:

```json
{
  "type": "text",
  "content": "Resposta do assistente"
}
```

Ou para imagens:

```json
{
  "type": "image",
  "url": "https://url-da-imagem.com/imagem.png",
  "content": "Descrição opcional"
}
```

## 📁 Estrutura do Projeto

```
/srv/frontend/
├── app/
│   ├── page.tsx           # Página principal
│   ├── layout.tsx         # Layout raiz
│   └── globals.css        # Estilos globais
├── components/
│   ├── Chat.tsx           # Componente principal do chat
│   ├── MessageBubble.tsx  # Balões de mensagem
│   ├── FileUploader.tsx   # Upload de arquivos
│   ├── SettingsModal.tsx  # Modal de configurações
│   └── ui/                # Componentes shadcn/ui
├── lib/
│   ├── store.ts           # Estado global (Zustand)
│   ├── types.ts           # Tipos TypeScript
│   ├── n8n-service.ts     # Serviço de integração n8n
│   └── utils.ts           # Utilitários
└── package.json
```

## 🛠️ Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Zustand** - Gerenciamento de estado
- **Framer Motion** - Animações
- **Axios** - Requisições HTTP

## 🔧 Personalização

### Alterar cores do tema

Edite o arquivo `/app/globals.css` para customizar as variáveis de cor.

### Modificar tipos de arquivo aceitos

Em `/components/FileUploader.tsx`, altere o array `validTypes`.

### Ajustar o formato da requisição n8n

Modifique `/lib/n8n-service.ts` para customizar o payload enviado.

## 📝 Formato da API n8n

### Requisição (POST)

```typescript
interface N8nRequest {
  message?: string;        // Texto da mensagem
  file?: string;          // Arquivo em base64
  fileName?: string;      // Nome do arquivo
  fileType?: string;      // MIME type
  session_id: string;     // ID da sessão
}
```

### Resposta (JSON)

```typescript
interface N8nResponse {
  type: 'text' | 'image';
  content?: string;       // Conteúdo textual
  url?: string;          // URL da imagem (se type = 'image')
  error?: string;        // Mensagem de erro (opcional)
}
```

## 💾 Persistência com PostgreSQL

Para salvar dados no PostgreSQL, defina as variáveis no arquivo `.env`:

```
POSTGRES_HOST=127.0.0.1
POSTGRES_USER=postgres
POSTGRES_PASSWORD=MPc3KWhKkLMdsvfqkWTgn3sgTWJPtpcs
POSTGRES_DB=ubvaia
```

Se não definir, o sistema usará SQLite local automaticamente.

## 🐛 Solução de Problemas

### Webhook não responde
- Verifique se a URL do webhook está correta
- Teste o webhook diretamente (ex: usando Postman)
- Verifique os logs do n8n para erros

### Arquivos não são enviados
- Confirme que o tipo de arquivo é suportado
- Verifique o tamanho (máximo 10MB por padrão)
- Ajuste o limite em `/components/FileUploader.tsx`

---

Desenvolvido com ❤️ usando Next.js e n8n
