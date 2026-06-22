/**
 * ws-server.ts — Servidor WebSocket integrado en bus-service.
 *
 * Permite que clientes (frontend, mobile) se suscriban a eventos en tiempo real.
 * Al publicar un evento en el bus, se hace broadcast a todos los clientes WS.
 *
 * Protocolo:
 *   - Cliente conecta: ws://host:3007/ws
 *   - Servidor envía pings cada 30s para detectar conexiones muertas
 *   - Al publicar evento, servidor emite: { type: 'event', data: BusEvent }
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

let wss: WebSocketServer | null = null;

const PING_INTERVAL_MS = 30_000;

/**
 * Inicializa el servidor WebSocket sobre un servidor HTTP existente.
 * Las conexiones WS se aceptan en el path `/ws`.
 */
export function initWebSocketServer(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientIp = req.socket.remoteAddress ?? 'unknown';
    console.log(`[ws-server] 🔌 Cliente conectado desde ${clientIp} — total: ${wss!.clients.size}`);

    // Enviar bienvenida
    ws.send(JSON.stringify({
      type: 'connected',
      data: {
        message: 'Conectado al bus de eventos Zenith Drive',
        timestamp: new Date().toISOString(),
      },
    }));

    // Marcar el socket como activo para ping/pong
    (ws as any).isAlive = true;
    ws.on('pong', () => { (ws as any).isAlive = true; });

    ws.on('close', () => {
      console.log(`[ws-server] 🔌 Cliente desconectado — total: ${wss!.clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[ws-server] Error en cliente WS:', err.message);
    });
  });

  // Ping periódico para limpiar conexiones muertas
  const pingInterval = setInterval(() => {
    wss!.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        ws.terminate();
        return;
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, PING_INTERVAL_MS);

  wss.on('close', () => clearInterval(pingInterval));

  console.log('[ws-server] ✅ WebSocket server iniciado en /ws');
  return wss;
}

/**
 * Emite un mensaje a todos los clientes WebSocket conectados.
 *
 * @param eventType   Tipo de evento (ej: 'RESERVA_CREADA')
 * @param data        Payload del evento
 */
export function broadcast(eventType: string, data: Record<string, unknown>): void {
  if (!wss || wss.clients.size === 0) return;

  const message = JSON.stringify({
    type:      'event',
    eventType,
    data,
    timestamp: new Date().toISOString(),
  });

  let sent = 0;
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      sent++;
    }
  });

  if (sent > 0) {
    console.log(`[ws-server] 📡 Broadcast ${eventType} → ${sent} cliente(s)`);
  }
}

export function getConnectedClients(): number {
  return wss?.clients.size ?? 0;
}
