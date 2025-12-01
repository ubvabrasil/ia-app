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

    const webhookUrl = configResult.rows[0].data?.webhookUrl;
    
    if (!webhookUrl) {
      return Response.json({ 
        success: false, 
        error: 'URL do webhook não encontrada' 
      }, { status: 400 });
    }

    // Recebe payload do frontend
    const payload = await req.json();

    // Envia para n8n com timeout de 10 segundos
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

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
