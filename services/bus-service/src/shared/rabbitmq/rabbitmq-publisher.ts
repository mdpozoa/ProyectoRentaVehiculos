/**
 * rabbitmq-publisher.ts — Publisher de eventos a RabbitMQ.
 *
 * Implementa publicación a un exchange tipo `topic` llamado `urbancar-events`.
 * Incluye reconexión automática con backoff exponencial para tolerancia a fallos.
 *
 * Routing keys usadas:
 *   - reserva.created        → financiero-events, mantenimiento-events
 *   - reserva.cancelled      → mantenimiento-events
 *   - alquiler.started       → mantenimiento-events
 *   - devolucion.registered  → financiero-events, mantenimiento-events
 */

import * as amqplib from 'amqplib';

const EXCHANGE_NAME = 'urbancar-events';
const EXCHANGE_TYPE = 'topic';

let connection: amqplib.ChannelModel | null = null;
let channel: amqplib.Channel | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;

const RABBITMQ_URL = () => process.env['RABBITMQ_URL'] ?? 'amqp://guest:guest@localhost:5672';

async function connect(attempt = 0): Promise<void> {
  if (isConnecting) return;
  isConnecting = true;

  try {
    connection = await amqplib.connect(RABBITMQ_URL());
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

    console.log('[rabbitmq-publisher] ✅ Conectado a RabbitMQ → exchange:', EXCHANGE_NAME);
    isConnecting = false;

    // Manejar desconexiones inesperadas
    (connection as any).on('error', (err: Error) => {
      console.error('[rabbitmq-publisher] Error de conexión:', err.message);
      scheduleReconnect();
    });
    (connection as any).on('close', () => {
      console.warn('[rabbitmq-publisher] Conexión cerrada — reintentando...');
      scheduleReconnect();
    });

  } catch (err) {
    isConnecting = false;
    const delay = Math.min(1000 * 2 ** attempt, 30_000); // max 30s
    console.warn(`[rabbitmq-publisher] No se pudo conectar (intento ${attempt + 1}) — reintentando en ${delay}ms`);
    scheduleReconnect(attempt + 1, delay);
  }
}

function scheduleReconnect(attempt = 0, delay = 5000): void {
  connection = null;
  channel = null;

  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => connect(attempt), delay);
}

/**
 * Publica un mensaje en el exchange de RabbitMQ.
 * Si el channel no está disponible, el mensaje se ignora con una advertencia.
 *
 * @param routingKey  Clave de enrutamiento (ej: 'reserva.created')
 * @param payload     Payload del evento
 * @returns           `true` si se publicó, `false` si no hay conexión
 */
export async function publishToRabbitMQ(
  routingKey: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  if (!channel) {
    console.warn(`[rabbitmq-publisher] ⚠️ Sin channel — mensaje descartado: ${routingKey}`);
    return false;
  }

  try {
    const content = Buffer.from(JSON.stringify(payload));
    channel.publish(EXCHANGE_NAME, routingKey, content, {
      persistent:   true,
      contentType:  'application/json',
      timestamp:    Math.floor(Date.now() / 1000),
    });
    console.log(`[rabbitmq-publisher] 📤 Evento publicado: ${routingKey}`);
    return true;
  } catch (err) {
    console.error('[rabbitmq-publisher] Error al publicar:', err);
    return false;
  }
}

export function isRabbitMQConnected(): boolean {
  return channel !== null;
}

export async function closeRabbitMQ(): Promise<void> {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  try {
    await channel?.close();
    if (connection) await connection.close();
  } catch { /* ignorar errores al cerrar */ }
  channel = null;
  connection = null;
}

// Iniciar conexión al importar el módulo
connect();
