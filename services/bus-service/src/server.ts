import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { initWebSocketServer } from './shared/websocket/ws-server.js';
import { getConnectedClients } from './shared/websocket/ws-server.js';

const PORT = Number(process.env.PORT ?? 3007);

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`[bus-service] 🚀 HTTP corriendo en http://localhost:${PORT}`);
  console.log(`[bus-service] 🔌 WebSocket disponible en ws://localhost:${PORT}/ws`);
  console.log(`[bus-service] Azure SB: ${process.env.AZURE_SERVICEBUS_CONNECTION_STRING ? 'CONECTADO' : 'modo local'}`);
});

// Log de estado periódico
setInterval(() => {
  const clients = getConnectedClients();
  if (clients > 0) {
    console.log(`[bus-service] 📡 Clientes WS activos: ${clients}`);
  }
}, 60_000);

