import { NextRequest } from 'next/server';
import { pool } from '../../../../lib/session-db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT data FROM webhook_config ORDER BY updated_at DESC LIMIT 1'
    );
    
    if (!result.rows.length) {
      return Response.json({ webhookUrl: '' });
    }

    return Response.json(result.rows[0].data || { webhookUrl: '' });
  } catch (err) {
    console.error('Erro ao buscar config do webhook:', err);
    return Response.json({ webhookUrl: '' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { webhookUrl } = await req.json();
    
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return Response.json({ 
        success: false, 
        error: 'URL do webhook inválida' 
      }, { status: 400 });
    }

    // Valida se é uma URL válida
    try {
      new URL(webhookUrl);
    } catch {
      return Response.json({ 
        success: false, 
        error: 'Formato de URL inválido' 
      }, { status: 400 });
    }

    await pool.query(
      'INSERT INTO webhook_config (data, updated_at) VALUES ($1, NOW())',
      [JSON.stringify({ webhookUrl })]
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error('Erro ao salvar config do webhook:', err);
    return Response.json({ 
      success: false, 
      error: 'Erro ao salvar configuração' 
    }, { status: 500 });
  }
}
