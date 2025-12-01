import { NextRequest } from 'next/server';
import { pool } from '../../../lib/session-db';

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

    // ENRIQUECIMENTO GLOBAL: Buscar dados da sessão quando disponível
    let enrichedPayload = { ...payload };
    
    try {
      const sessionId = payload?.sessionId || payload?.session_id;
      if (sessionId) {
        const sessionResult = await pool.query(
          'SELECT id, nome_completo, remote_jid, created_at, updated_at FROM sessions WHERE id = $1 LIMIT 1',
          [sessionId]
        );
        
        if (sessionResult.rows.length > 0) {
          const session = sessionResult.rows[0];
          enrichedPayload = {
            message: payload?.Message || payload?.message || payload?.content || '',
            event: payload?.Event || payload?.event || 'SEND_MESSAGE',
            filebase64: payload?.fileBase64 || payload?.filebase64 || null,
            fileurl: payload?.fileUrl || payload?.fileurl || null,
            filetype: payload?.fileType || payload?.filetype || null,
            sessionid: sessionId,
            username: payload?.userName || payload?.username || session.nome_completo || null,
            whatsappnumber: payload?.whatsappNumber || payload?.whatsappnumber || session.remote_jid || null,
            contenttype: payload?.contentType || payload?.contenttype || 'text',
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.error('Erro ao enriquecer payload com dados da sessão:', err);
    }

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
