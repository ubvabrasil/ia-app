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

    const data = result.rows[0].data;
    // Retorna no formato novo, mas extrai de formatos antigos se necessário
    const webhookUrl = data?.webhookUrl || data?.webhook?.baseUrl || data?.baseUrl || '';
    return Response.json({ webhookUrl });
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

export async function DELETE() {
  try {
    // Remove todas as entradas de webhook_config
    await pool.query('DELETE FROM webhook_config');
    return Response.json({ success: true });
  } catch (err) {
    console.error('Erro ao deletar config do webhook:', err);
    return Response.json({ success: false, error: 'Erro ao deletar configuração' }, { status: 500 });
  }
}
