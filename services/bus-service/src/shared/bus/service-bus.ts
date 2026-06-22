import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import { randomUUID } from 'crypto';
import { BusEvent, EventType } from './event-types.js';
import { publishToRabbitMQ, isRabbitMQConnected } from '../rabbitmq/rabbitmq-publisher.js';
import { broadcast } from '../websocket/ws-server.js';

const inMemoryLog: BusEvent[] = [];
let sender: ServiceBusSender | null = null;

/** Mapea EventType a routing key de RabbitMQ */
const ROUTING_KEY_MAP: Record<EventType, string> = {
  RESERVA_CREADA:        'reserva.created',
  RESERVA_CANCELADA:     'reserva.cancelled',
  ALQUILER_INICIADO:     'alquiler.started',
  ALQUILER_CANCELADO:    'alquiler.cancelled',
  DEVOLUCION_REGISTRADA: 'devolucion.registered',
};

function initSender(): void {
  const connStr = process.env.AZURE_SERVICEBUS_CONNECTION_STRING;
  const topic   = process.env.AZURE_SERVICEBUS_TOPIC ?? 'urbancar-eventos';
  if (!connStr) {
    console.warn('[bus-service] AZURE_SERVICEBUS_CONNECTION_STRING no configurado — modo local activo');
    return;
  }
  try {
    const client = new ServiceBusClient(connStr);
    sender = client.createSender(topic);
    console.log(`[bus-service] Azure Service Bus conectado → topic: ${topic}`);
  } catch (err) {
    console.error('[bus-service] Error al conectar Azure Service Bus:', err);
  }
}

initSender();

export async function publishEvent(
  tipo: EventType,
  usuarioId: string,
  entidadId: string,
  payload: Record<string, unknown>,
): Promise<BusEvent> {
  const routingKey = ROUTING_KEY_MAP[tipo] ?? tipo.toLowerCase().replace(/_/g, '.');

  const event: BusEvent = {
    id: randomUUID(),
    tipo,
    usuarioId,
    entidadId,
    payload,
    publicadoEn: new Date().toISOString(),
    destino: isRabbitMQConnected() ? 'rabbitmq' : (sender ? 'azure-service-bus' : 'local'),
  };

  // ── 1. RabbitMQ (broker local, preferido) ───────────────────────────────────
  const rmqPayload = { ...payload, id: event.id, usuarioId, entidadId, tipo, publicadoEn: event.publicadoEn };
  const rmqPublished = await publishToRabbitMQ(routingKey, rmqPayload);

  // ── 2. Azure Service Bus (fallback externo) ──────────────────────────────────
  if (sender) {
    try {
      await sender.sendMessages({ body: event, contentType: 'application/json', subject: tipo });
      if (!rmqPublished) event.destino = 'azure-service-bus';
    } catch (err) {
      console.warn('[bus-service] Error publicando en Azure SB:', (err as Error).message);
    }
  }

  if (!rmqPublished && !sender) {
    console.log('[bus-service][local-event]', JSON.stringify(event));
  }

  // ── 3. WebSocket broadcast (tiempo real) ─────────────────────────────────────
  broadcast(tipo, { ...event, routingKey });

  inMemoryLog.unshift(event);
  if (inMemoryLog.length > 200) inMemoryLog.pop();

  return event;
}

export function isSenderConnected(): boolean {
  return sender !== null;
}

export function getEventLog(page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    items: inMemoryLog.slice(start, start + limit),
    total: inMemoryLog.length,
    page,
    limit,
    totalPages: Math.ceil(inMemoryLog.length / limit),
  };
}
