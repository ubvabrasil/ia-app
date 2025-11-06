import { NextResponse } from 'next/server';

const allowedOrigins = [
  'https://*.easydev.com.br',
  'http://192.168.3.*',
  'http://localhost:3000',
];

export function proxy(req: Request) {
  const origin = req.headers.get('origin') || '';
  const res = NextResponse.next();

  // Allow all in dev mode or only whitelisted
  if (process.env.NODE_ENV === 'development' || allowedOrigins.some(o => origin.match(o.replace('*', '.*')))) {
    res.headers.set('Access-Control-Allow-Origin', origin || '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: res.headers,
    });
  }

  return res;
}

export const config = {
  matcher: '/api/:path*',
};