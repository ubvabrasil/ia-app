// Servidor customizado Next.js com WebSocket integrado
import 'dotenv/config';
import { createServer } from 'http';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Accept connections from any host
const port = parseInt(process.env.PORT || '3000', 10);

// Preparar app Next.js com Turbopack para dev rápido
const app = next({ 
  dev, 
  hostname, 
  port,
  turbo: dev, // Enable Turbopack in development for 10x faster startup
});
const handle = app.getRequestHandler();

// Tipos de mensagens WebSocket
interface WSMessage {
  type: 'message' | 'session' | 'ping' | 'pong';
  data?: any;
  timestamp?: string;
}

app.prepare().then(() => {
  // Criar servidor HTTP
  const server = createServer(async (req, res) => {
    try {
      // Use WHATWG URL API to parse the URL
      const url = new URL(req.url!, `http://${req.headers.host}`);
      // Create a compatible object for Next.js handle function
      const parsedUrl = {
        pathname: url.pathname,
        query: Object.fromEntries(url.searchParams),
        href: url.href,
        search: url.search,
        hash: url.hash,
      };
      await handle(req, res, parsedUrl as any);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Criar servidor WebSocket
  const wss = new WebSocketServer({ 
    noServer: true
  });

  // Upgrade para WebSocket apenas no path /ws
  server.on('upgrade', (request, socket, head) => {
    try {
      // Use WHATWG URL API instead of url.parse()
      const url = new URL(request.url || '/', `http://${request.headers.host}`);
      const pathname = url.pathname;
      
      // Apenas interceptar nosso WebSocket em /ws
      if (pathname === '/ws') {
        console.log('✅ Aceitando conexão WebSocket em /ws');
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
      // Para outros paths (incluindo HMR do Next.js /_next/webpack-hmr), não fazer nada
      // O Next.js tem seus próprios handlers de upgrade
    } catch (error) {
      console.error('❌ Erro no upgrade WebSocket:', error);
      socket.destroy();
    }
  });

  // Armazenar clientes conectados
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('✅ Novo cliente WebSocket conectado');
    clients.add(ws);

    // Enviar confirmação de conexão
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Conectado ao servidor WebSocket',
      timestamp: new Date().toISOString(),
    }));

    // Receber mensagens do cliente
    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        
        // Responder a ping
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          return;
        }

        // Broadcast para todos os outros clientes
        console.log('📨 Broadcasting mensagem:', message.type);
        broadcast(message, ws);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem WebSocket:', error);
      }
    });

    // Cliente desconectado
    ws.on('close', () => {
      console.log('❌ Cliente WebSocket desconectado');
      clients.delete(ws);
    });

    // Erro na conexão
    ws.on('error', (error) => {
      console.error('❌ Erro no WebSocket:', error);
      clients.delete(ws);
    });
  });

  // Função para broadcast de mensagens
  function broadcast(message: WSMessage, sender?: WebSocket) {
    const data = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString(),
    });

    clients.forEach((client) => {
      // Não enviar de volta para o remetente (evitar duplicação)
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Heartbeat para manter conexões vivas
  const heartbeat = setInterval(() => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: 'heartbeat', 
          timestamp: new Date().toISOString() 
        }));
      }
    });
  }, 30000); // A cada 30 segundos

  // Iniciar servidor
  server.listen(port, () => {
    console.log(`🚀 Next.js rodando em http://${hostname}:${port}`);
    console.log(`📡 WebSocket disponível em ws://${hostname}:${port}/ws`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n⏹️  Encerrando servidor...');
    clearInterval(heartbeat);
    wss.close(() => {
      console.log('✅ WebSocket encerrado');
      server.close(() => {
        console.log('✅ Servidor HTTP encerrado');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
