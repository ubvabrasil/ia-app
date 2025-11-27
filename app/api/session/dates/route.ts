import { NextResponse } from 'next/server';
import { pool } from '@/lib/session-db';

export async function GET() {
  try {
    // Buscar todas as datas únicas de mensagens no formato YYYY-MM-DD
    const result = await pool.query(`
      SELECT DISTINCT TO_CHAR(created_at, 'YYYY-MM-DD') as date
      FROM messages
      ORDER BY date DESC
    `);
    
    const dates = result.rows.map(row => row.date);
    
    return NextResponse.json(dates);
  } catch (error) {
    console.error('Erro ao buscar datas:', error);
    return NextResponse.json({ error: 'Erro ao buscar datas' }, { status: 500 });
  }
}
