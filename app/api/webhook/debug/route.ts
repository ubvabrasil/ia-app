import { NextRequest } from 'next/server';
import { pool } from '../../../../lib/session-db';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Extrair sessionId (suporta sessionId, session_id e sessionid)
    const sessionId = payload?.sessionId || payload?.session_id || payload?.sessionid;
    
    if (!sessionId) {
      return Response.json({ 
        success: false, 
        error: 'sessionId é obrigatório' 
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
      enrichedPayload.metadata._enrichment_error = err instanceof Error ? err.message : String(err);
    }

    // Retorna o payload enriquecido para debug
    return Response.json({
      success: true,
      message: 'Este é o payload que seria enviado ao webhook',
      payload: enrichedPayload,
      payload_size: JSON.stringify(enrichedPayload).length,
      all_fields_present: {
        base_fields: {
          message: enrichedPayload.message !== undefined,
          event: enrichedPayload.event !== undefined,
          filebase64: enrichedPayload.filebase64 !== undefined,
          sessionid: enrichedPayload.sessionid !== undefined,
          username: enrichedPayload.username !== undefined,
          whatsappnumber: enrichedPayload.whatsappnumber !== undefined,
          contenttype: enrichedPayload.contenttype !== undefined,
        },
        metadata_fields: {
          session_name: enrichedPayload.metadata.session_name !== undefined,
          session_created_at: enrichedPayload.metadata.session_created_at !== undefined,
          session_updated_at: enrichedPayload.metadata.session_updated_at !== undefined,
          total_messages: enrichedPayload.metadata.total_messages !== undefined,
          user_messages: enrichedPayload.metadata.user_messages !== undefined,
          assistant_messages: enrichedPayload.metadata.assistant_messages !== undefined,
          last_message_at: enrichedPayload.metadata.last_message_at !== undefined,
          original_role: enrichedPayload.metadata.original_role !== undefined,
          message_id: enrichedPayload.metadata.message_id !== undefined,
          file_url: enrichedPayload.metadata.file_url !== undefined,
          file_type: enrichedPayload.metadata.file_type !== undefined,
          image_url: enrichedPayload.metadata.image_url !== undefined,
          audio_url: enrichedPayload.metadata.audio_url !== undefined,
          mime_type: enrichedPayload.metadata.mime_type !== undefined,
          timestamp: enrichedPayload.metadata.timestamp !== undefined,
          webhook_sent_at: enrichedPayload.metadata.webhook_sent_at !== undefined,
          request_ip: enrichedPayload.metadata.request_ip !== undefined,
          user_agent: enrichedPayload.metadata.user_agent !== undefined,
        }
      }
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (err: any) {
    console.error('Erro no debug do webhook:', err);
    return Response.json({ 
      success: false, 
      error: err.message || 'Erro ao processar debug' 
    }, { status: 500 });
  }
}
