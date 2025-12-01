# 🔗 Guia Webhook n8n - UBVA IA

## 📤 Formato de Envio (Request)

Quando uma mensagem é enviada, o webhook **envia para o n8n** no formato:

```json
{
  "message": "Olá, quero fazer um pedido",
  "event": "SEND_MESSAGE",
  "filebase64": null,
  "sessionid": "sess_123456789",
  "username": "João Silva",
  "whatsappnumber": "5511999999999",
  "contenttype": "text",
  "timestamp": "2025-12-01T14:30:00.000Z"
}
```

### Campos Enviados (todos em minúsculas):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `message` | string | **Texto da mensagem do usuário** |
| `event` | string | Sempre "SEND_MESSAGE" |
| `filebase64` | string/null | Base64 do áudio ou imagem (null para texto) |
| `sessionid` | string | ID da sessão do chat |
| `username` | string/null | Nome do usuário identificado |
| `whatsappnumber` | string/null | Número do WhatsApp (quando disponível) |
| `contenttype` | string | Tipo: "text", "audio", "image" ou "file" |
| `timestamp` | string | Data/hora ISO 8601 |

### Exemplos de Payloads:

#### Mensagem de Texto:
```json
{
  "message": "Qual o horário de funcionamento?",
  "event": "SEND_MESSAGE",
  "filebase64": null,
  "sessionid": "sess_123",
  "username": "Maria",
  "whatsappnumber": "5511987654321",
  "contenttype": "text"
}
```

#### Mensagem com Áudio:
```json
{
  "message": "Áudio enviado",
  "event": "SEND_MESSAGE",
  "filebase64": "data:audio/mpeg;base64,//uQxAAA...",
  "sessionid": "sess_123",
  "username": "João",
  "whatsappnumber": "5511999999999",
  "contenttype": "audio"
}
```

#### Mensagem com Imagem:
```json
{
  "message": "Imagem enviada",
  "event": "SEND_MESSAGE",
  "filebase64": "data:image/png;base64,iVBORw0KGgo...",
  "sessionid": "sess_123",
  "username": "Pedro",
  "whatsappnumber": "5511988888888",
  "contenttype": "image"
}
```

---

## 📥 Formato de Resposta (Response)

O n8n **DEVE responder** com um JSON contendo o campo `output`:

```json
{
  "output": "Olá João! Vi que você quer fazer um pedido. O que gostaria?"
}
```

### ⚠️ IMPORTANTE:

- ✅ **Campo obrigatório**: `output` (texto da resposta)
- ✅ **HTTP Status**: 200 (sucesso)
- ✅ **Content-Type**: `application/json`

### Campos aceitos (em ordem de prioridade):
1. `output` ⭐ **RECOMENDADO**
2. `content` (compatibilidade)
3. `text`
4. `Resposta`
5. `answer`

### ❌ Não funcionará se:
- Retornar só texto plano (precisa ser JSON)
- Não incluir nenhum dos campos aceitos
- Retornar status diferente de 200

---

## 🎯 Exemplo Completo no n8n

### 1️⃣ Webhook Trigger (Entrada)

```
Webhook Node
├─ HTTP Method: POST
├─ Path: webhook/ia-agent-ubva
└─ Response: Immediately
```

### 2️⃣ Processar Mensagem

```javascript
// No n8n Code Node (JavaScript)
const userMessage = $input.item.json.message;
const userName = $input.item.json.username || 'Cliente';
const sessionId = $input.item.json.sessionid;
const filebase64 = $input.item.json.filebase64;
const contentType = $input.item.json.contenttype;

// Sua lógica de IA/processamento aqui
let response = `Olá ${userName}! Recebi sua mensagem: "${userMessage}"`;

// Se tem arquivo (áudio ou imagem)
if (filebase64) {
  response = `${response} (com arquivo ${contentType})`;
}

return {
  output: response  // ⭐ Use "output" como campo de resposta
};
```

### 3️⃣ Responder ao Webhook

```
Respond to Webhook Node
├─ Response Body: {{ $json }}
└─ Status Code: 200
```

---

## 🔄 Fluxo Completo

```
Usuário digita → Chat envia → /api/webhook → n8n processa → Retorna {content} → Chat exibe
```

---

## 🧪 Testar Manualmente

### Enviar mensagem de teste:
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste de mensagem",
    "event": "SEND_MESSAGE",
    "filebase64": null,
    "sessionid": "test-session",
    "username": "Teste",
    "whatsappnumber": "5511999999999",
    "contenttype": "text"
  }'
```

### Resposta esperada do n8n:
```json
{
  "output": "Resposta da IA"
}
```

---

## 📋 Checklist de Integração

- [ ] Webhook n8n criado e ativo
- [ ] URL do webhook configurada em `/admin/webhook`
- [ ] Node "Respond to Webhook" adicionado no final do workflow
- [ ] Resposta retorna `{"content": "texto"}` com status 200
- [ ] Testado envio e recebimento de mensagens

---

## 🐛 Troubleshooting

### Erro: "Webhook não configurado"
→ Configure a URL em `http://localhost:3000/admin/webhook`

### Mensagem não aparece no chat
→ Verifique se n8n retorna `{"content": "..."}` com status 200

### Timeout
→ n8n deve responder em até 10 segundos

### CORS Error
→ Não deve acontecer (usamos proxy server-side)

---

## 💡 Exemplo de Workflow n8n Completo

```
┌─────────────────┐
│ Webhook Trigger │ ← Recebe POST com {message, event, filebase64, ...}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract Data    │ ← Pega {{ $json.message }}, {{ $json.filebase64 }}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI/Logic Node   │ ← Processa com OpenAI, Groq, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Format Response │ ← Retorna {"output": "resposta da IA"}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Respond Webhook │ ← Status 200, body: {{ $json }}
└─────────────────┘
```

---

**✅ Pronto! Agora você sabe exatamente como configurar o n8n para funcionar com o sistema.**
