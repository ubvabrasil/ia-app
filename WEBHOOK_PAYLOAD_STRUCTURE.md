# Estrutura do Payload do Webhook

Este documento descreve a estrutura completa do payload que é enviado para o webhook n8n.

## Estrutura Completa

```json
{
  "message": "texto da mensagem",
  "event": "SEND_MESSAGE",
  "filebase64": null,
  "sessionid": "...",
  "username": "...",
  "whatsappnumber": "...",
  "contenttype": "text",
  
  "metadata": {
    // Informações da sessão
    "session_name": "Nome da Sessão",
    "session_created_at": "2024-12-05T10:00:00Z",
    "session_updated_at": "2024-12-05T15:30:00Z",
    
    // Estatísticas
    "total_messages": 45,
    "user_messages": 23,
    "assistant_messages": 22,
    "last_message_at": "2024-12-05T15:30:00Z",
    
    // Informações da mensagem
    "original_role": "user",
    "message_id": "msg-uuid",
    
    // URLs e arquivos (quando disponíveis)
    "file_url": "https://...",
    "file_type": "image/png",
    "image_url": "data:image/png;base64,...",
    "audio_url": "https://...",
    "mime_type": "audio/webm",
    
    // Rastreamento
    "timestamp": "2024-12-05T15:30:45.123Z",
    "webhook_sent_at": "2024-12-05T15:30:45.123Z",
    "request_ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  }
}
```

## Campos de Nível Superior

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `message` | string | Texto da mensagem enviada | Sim |
| `event` | string | Tipo de evento (padrão: "SEND_MESSAGE") | Sim |
| `filebase64` | string \| null | Arquivo em base64 (áudio, imagem, etc.) | Não |
| `sessionid` | string | ID único da sessão | Sim |
| `username` | string \| null | Nome completo do usuário | Não |
| `whatsappnumber` | string \| null | Número do WhatsApp (remote_jid) | Não |
| `contenttype` | string | Tipo de conteúdo (text, audio, image, file) | Sim |

## Objeto Metadata

### Informações da Sessão
- `session_name`: Nome da sessão no sistema
- `session_created_at`: Data/hora de criação da sessão (ISO 8601)
- `session_updated_at`: Data/hora da última atualização (ISO 8601)

### Estatísticas
- `total_messages`: Total de mensagens na sessão
- `user_messages`: Número de mensagens do usuário
- `assistant_messages`: Número de mensagens do assistente
- `last_message_at`: Data/hora da última mensagem (ISO 8601)

### Informações da Mensagem
- `original_role`: Role da mensagem (user, assistant, system)
- `message_id`: ID único da mensagem

### URLs e Arquivos
- `file_url`: URL do arquivo (quando disponível)
- `file_type`: Tipo MIME do arquivo
- `image_url`: URL da imagem ou data URI base64
- `audio_url`: URL do áudio
- `mime_type`: Tipo MIME do conteúdo

### Rastreamento
- `timestamp`: Data/hora de criação do payload (ISO 8601)
- `webhook_sent_at`: Data/hora de envio ao webhook (ISO 8601)
- `request_ip`: IP de origem da requisição
- `user_agent`: User agent do cliente

## Exemplo: Mensagem de Texto

```json
{
  "message": "Olá, como você está?",
  "event": "SEND_MESSAGE",
  "filebase64": null,
  "sessionid": "5511999887766",
  "username": "João Silva",
  "whatsappnumber": "5511999887766@s.whatsapp.net",
  "contenttype": "text",
  "metadata": {
    "session_name": "João Silv",
    "session_created_at": "2024-12-05T08:30:00.000Z",
    "session_updated_at": "2024-12-05T14:22:15.000Z",
    "total_messages": 12,
    "user_messages": 6,
    "assistant_messages": 6,
    "last_message_at": "2024-12-05T14:22:15.000Z",
    "original_role": "user",
    "message_id": "msg-abc123",
    "file_url": null,
    "file_type": null,
    "image_url": null,
    "audio_url": null,
    "mime_type": null,
    "timestamp": "2024-12-05T14:22:16.123Z",
    "webhook_sent_at": "2024-12-05T14:22:16.123Z",
    "request_ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
}
```

## Exemplo: Mensagem com Áudio

```json
{
  "message": "",
  "event": "SEND_MESSAGE",
  "filebase64": "//uQx...base64...",
  "sessionid": "5511888776655",
  "username": "Maria Santos",
  "whatsappnumber": "5511888776655@s.whatsapp.net",
  "contenttype": "audio",
  "metadata": {
    "session_name": "Maria Sa",
    "session_created_at": "2024-12-04T10:00:00.000Z",
    "session_updated_at": "2024-12-05T15:10:30.000Z",
    "total_messages": 24,
    "user_messages": 12,
    "assistant_messages": 12,
    "last_message_at": "2024-12-05T15:10:30.000Z",
    "original_role": "user",
    "message_id": "msg-xyz789",
    "file_url": null,
    "file_type": "audio/webm",
    "image_url": null,
    "audio_url": "https://storage.example.com/audio/xyz789.webm",
    "mime_type": "audio/webm",
    "timestamp": "2024-12-05T15:10:31.456Z",
    "webhook_sent_at": "2024-12-05T15:10:31.456Z",
    "request_ip": "192.168.1.105",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"
  }
}
```

## Exemplo: Sessão Não Encontrada

Quando o `sessionid` é fornecido mas não existe no banco de dados, o payload ainda é enviado com valores padrão:

```json
{
  "message": "Mensagem de sistema externo",
  "event": "SEND_MESSAGE",
  "filebase64": null,
  "sessionid": "session-inexistente-123",
  "username": null,
  "whatsappnumber": null,
  "contenttype": "text",
  "metadata": {
    "session_name": null,
    "session_created_at": null,
    "session_updated_at": null,
    "total_messages": 0,
    "user_messages": 0,
    "assistant_messages": 0,
    "last_message_at": null,
    "original_role": null,
    "message_id": null,
    "file_url": null,
    "file_type": null,
    "image_url": null,
    "audio_url": null,
    "mime_type": null,
    "timestamp": "2024-12-05T15:30:00.000Z",
    "webhook_sent_at": "2024-12-05T15:30:00.000Z",
    "request_ip": "192.168.1.100",
    "user_agent": "curl/7.68.0"
  }
}
```

## Mapeamento de Campos de Entrada

O webhook aceita múltiplos nomes de campos para compatibilidade:

### SessionId
- `sessionId`
- `sessionid`
- `session_id`

### Message
- `message`
- `Message`
- `content`

### Event
- `event`
- `Event`

### Username
- `username`
- `userName`

### WhatsApp Number
- `whatsappnumber`
- `whatsappNumber`

### Content Type
- `contenttype`
- `contentType`

### File Base64
- `filebase64`
- `fileBase64`
- `audioBase64`
- `imageBase64`

## Notas Importantes

1. **Campos Obrigatórios**: Apenas `sessionid` é obrigatório. Todos os outros campos podem ser `null`.

2. **Enriquecimento Automático**: Se a sessão existir no banco de dados, os campos `username`, `whatsappnumber` e todos os campos de `metadata` são preenchidos automaticamente.

3. **Garantia de Estrutura**: Mesmo em caso de erro ao buscar dados do banco, a estrutura completa do payload é mantida com valores `null` ou padrão.

4. **Timestamps**: Todos os timestamps seguem o formato ISO 8601 (UTC).

5. **Compatibilidade**: O endpoint aceita variações de nomes de campos (case-insensitive) para facilitar integração com diferentes sistemas.
