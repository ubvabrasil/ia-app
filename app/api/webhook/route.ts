import { NextRequest } from 'next/server';
import { pool } from '../../../lib/session-db';

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Status': 'active',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, HEAD, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Busca URL do webhook configurada
    const configResult = await pool.query(
      'SELECT data FROM webhook_config ORDER BY updated_at DESC LIMIT 1'
    );
    
    if (!configResult.rows.length) {
      return Response.json({ 
        success: false, 
        error: 'Webhook não configurado' 
      }, { status: 400 });
    }

    const data = configResult.rows[0].data;
    // Suporta múltiplos formatos: novo (webhookUrl) e antigo (webhook.baseUrl)
    const webhookUrl = data?.webhookUrl || data?.webhook?.baseUrl || data?.baseUrl;
    
    if (!webhookUrl) {
      return Response.json({ 
        success: false, 
        error: 'URL do webhook não encontrada' 
      }, { status: 400 });
    }

    // Recebe payload do frontend
    const payload = await req.json();

    // Extrair sessionId primeiro (suporta sessionId, session_id e sessionid)
    const sessionId = payload?.sessionId || payload?.session_id || payload?.sessionid;
    
    if (!sessionId) {
      return Response.json({ 
        success: false, 
        error: 'sessionId é obrigatório para enviar ao webhook' 
      }, { status: 400 });
    }

    // ENRIQUECIMENTO ROBUSTO: Buscar todas as informações disponíveis
    let enrichedPayload: any = {
      message: payload?.Message || payload?.message || payload?.content || '',
      event: payload?.Event || payload?.event || 'SEND_MESSAGE',
      filebase64: payload?.fileBase64 || payload?.filebase64 || payload?.audioBase64 || payload?.imageBase64 || null,
      sessionid: sessionId,
      username: payload?.userName || payload?.username || null,
      whatsappnumber: payload?.whatsappNumber || payload?.whatsappnumber || null,
      contenttype: payload?.contentType || payload?.contenttype || 'text',
      metadata: {
        // Valores padrão - serão substituídos se encontrar dados
        session_name: null,
        session_created_at: null,
        session_updated_at: null,
        total_messages: 0,
        user_messages: 0,
        assistant_messages: 0,
        last_message_at: null,
        original_role: payload?.role || null,
        message_id: payload?.id || payload?.messageId || null,
        file_url: payload?.fileUrl || payload?.fileurl || null,
        file_type: payload?.fileType || payload?.filetype || null,
        image_url: payload?.imageUrl || payload?.image_url || null,
        audio_url: payload?.audioUrl || payload?.audio_url || null,
        mime_type: payload?.mimeType || payload?.mime_type || null,
        timestamp: new Date().toISOString(),
        webhook_sent_at: new Date().toISOString(),
        request_ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        user_agent: req.headers.get('user-agent') || null,
      },
    };
    
    try {
      // Buscar dados da sessão
      const sessionResult = await pool.query(
        'SELECT id, name, nome_completo, remote_jid, created_at FROM sessions WHERE id = $1 LIMIT 1',
        [sessionId]
      );
      
      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];
        
        // Buscar estatísticas da sessão
        const statsResult = await pool.query(
          `SELECT 
            COUNT(*) as total_messages,
            COUNT(CASE WHEN role = 'user' THEN 1 END) as user_messages,
            COUNT(CASE WHEN role = 'assistant' THEN 1 END) as assistant_messages,
            MAX(created_at) as last_message_at
           FROM messages WHERE session_id = $1`,
          [sessionId]
        );
        
        const stats = statsResult.rows[0] || {};
        
        // Atualizar campos base com dados da sessão
        enrichedPayload.username = enrichedPayload.username || session.nome_completo || null;
        enrichedPayload.whatsappnumber = enrichedPayload.whatsappnumber || session.remote_jid || null;
        
        // Atualizar metadata com dados da sessão
        enrichedPayload.metadata.session_name = session.name || null;
        enrichedPayload.metadata.session_created_at = session.created_at || null;
        enrichedPayload.metadata.session_updated_at = stats.last_message_at || session.created_at || null;
        enrichedPayload.metadata.total_messages = parseInt(stats.total_messages || '0');
        enrichedPayload.metadata.user_messages = parseInt(stats.user_messages || '0');
        enrichedPayload.metadata.assistant_messages = parseInt(stats.assistant_messages || '0');
        enrichedPayload.metadata.last_message_at = stats.last_message_at || null;
      }
    } catch (err) {
      console.error('Erro ao enriquecer payload com dados da sessão:', err);
      // Mantém estrutura base mesmo com erro
    }

    // Log do payload completo para debug
    console.log('📦 Payload completo sendo enviado ao webhook:');
    console.log(JSON.stringify(enrichedPayload, null, 2));

    // Envia para n8n com timeout de 30 segundos
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      console.log('🔗 Conectando ao webhook:', webhookUrl);
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrichedPayload),
        signal: controller.signal,
      });
      console.log('✅ Webhook respondeu com status:', response.status);
      console.log('✅ Webhook respondeu com status:', response.status);
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      
      if (fetchErr.name === 'AbortError') {
        console.error('⏱️  Timeout ao conectar ao webhook (30s):', webhookUrl);
        return Response.json({ 
          success: false, 
          error: 'Timeout ao conectar ao webhook' 
        }, { status: 504 });
      }
      
      const errorMessage = fetchErr.message || String(fetchErr);
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ConnectTimeoutError')) {
        console.error('❌ Não foi possível conectar ao webhook:', webhookUrl);
        console.error('Erro:', errorMessage);
        return Response.json({ 
          success: false, 
          error: 'Não foi possível conectar ao servidor n8n. Verifique se o serviço está ativo.' 
        }, { status: 503 });
      }
      
      throw fetchErr;
    }

    const responseData = await response.json().catch(() => ({}));

    return Response.json({
      success: response.ok,
      status: response.status,
      data: responseData,
    });

  } catch (err: any) {
    console.error('Erro ao enviar webhook:', err);
    return Response.json({ 
      success: false, 
      error: err.message || 'Erro ao enviar webhook' 
    }, { status: 500 });
  }
}
