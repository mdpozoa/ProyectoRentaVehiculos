/**
 * rabbitmq-consumer.ts — Consumer de RabbitMQ para mantenimiento-service.
 *
 * Se suscribe al exchange `urbancar-events` con routing keys:
 *   - alquiler.started       → crea kardex de salida (vehículo pasa a EN_USO)
 *   - devolucion.registered  → crea kardex de entrada (vehículo pasa a DISPONIBLE/MANTENIMIENTO)
 *   - vehiculo.updated       → registra cambios de estado del vehículo en kardex
 *
 * Queue: mantenimiento-events (durable)
 */

import * as amqplib from 'amqplib';
import { KardexRepository } from '../../modules/kardex/kardex.repository.js';
import prisma from '../database/prisma.js';

const EXCHANGE_NAME = 'urbancar-events';
const QUEUE_NAME    = 'mantenimiento-events';
const BINDING_KEYS  = ['alquiler.started', 'devolucion.registered', 'vehiculo.updated'];

const RABBITMQ_URL = () => process.env['RABBITMQ_URL'] ?? 'amqp://guest:guest@localhost:5672';

let connection: amqplib.ChannelModel | null = null;
let channel: amqplib.Channel | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const kardexRepo = new KardexRepository(prisma);

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleAlquilerStarted(payload: Record<string, unknown>, usuarioId: string): Promise<void> {
  const { vehiculoId, alquilerId, kmSalida } = payload;
  if (!vehiculoId) {
    console.warn('[mantenimiento-rmq] alquiler.started sin vehiculoId');
    return;
  }

  await kardexRepo.create({
    vehiculoId:    vehiculoId as string,
    evento:        'SALIDA_ALQUILER',
    estadoAnterior: 'DISPONIBLE',
    estadoNuevo:   'EN_USO',
    usuarioId:     usuarioId || 'system',
    referencia:    alquilerId as string,
    ...(kmSalida !== undefined && { observaciones: `KM salida: ${kmSalida}` }),
  });

  console.log(`[mantenimiento-rmq] ✅ Kardex SALIDA: vehículo ${vehiculoId} → EN_USO`);
}

async function handleDevolucionRegistrada(payload: Record<string, unknown>, usuarioId: string): Promise<void> {
  const { vehiculoId, alquilerId, estadoVehiculo, kmEntrada, observaciones } = payload;
  if (!vehiculoId) {
    console.warn('[mantenimiento-rmq] devolucion.registered sin vehiculoId');
    return;
  }

  const necesitaMantenimiento = estadoVehiculo &&
    ['MALO', 'DANADO', 'DAÑADO', 'REQUIERE_MANTENIMIENTO'].includes(
      String(estadoVehiculo).toUpperCase(),
    );

  const estadoNuevo = necesitaMantenimiento ? 'MANTENIMIENTO' : 'DISPONIBLE';

  await kardexRepo.create({
    vehiculoId:    vehiculoId as string,
    evento:        'DEVOLUCION',
    estadoAnterior: 'EN_USO',
    estadoNuevo,
    usuarioId:     usuarioId || 'system',
    referencia:    alquilerId as string,
    ...(kmEntrada    && { observaciones: `KM entrada: ${kmEntrada}` }),
    ...(observaciones && { observaciones: observaciones as string }),
  });

  console.log(`[mantenimiento-rmq] ✅ Kardex DEVOLUCION: vehículo ${vehiculoId} → ${estadoNuevo}`);

  if (necesitaMantenimiento) {
    console.warn(`[mantenimiento-rmq] ⚠️ Vehículo ${vehiculoId} requiere atención: estado="${estadoVehiculo}"`);
  }
}

async function handleVehiculoUpdated(payload: Record<string, unknown>, usuarioId: string): Promise<void> {
  const { vehiculoId, estadoAnterior, estadoNuevo } = payload;
  if (!vehiculoId || !estadoNuevo) return;

  await kardexRepo.create({
    vehiculoId:    vehiculoId as string,
    evento:        'ACTUALIZACION_ESTADO',
    estadoAnterior: (estadoAnterior as string) || 'DESCONOCIDO',
    estadoNuevo:   estadoNuevo as string,
    usuarioId:     usuarioId || 'system',
  });

  console.log(`[mantenimiento-rmq] ✅ Kardex ACTUALIZACION: vehículo ${vehiculoId} → ${estadoNuevo}`);
}

// ── Consumer setup ────────────────────────────────────────────────────────────

async function startConsumer(attempt = 0): Promise<void> {
  try {
    connection = await amqplib.connect(RABBITMQ_URL());
    channel    = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true, arguments: { 'x-queue-type': 'classic' } });

    for (const key of BINDING_KEYS) {
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, key);
    }

    channel.prefetch(1);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const envelope = JSON.parse(msg.content.toString()) as {
          payload:   Record<string, unknown>;
          usuarioId: string;
        };
        const routingKey = msg.fields.routingKey;
        const payload    = envelope.payload ?? (envelope as unknown as Record<string, unknown>);
        const usuarioId  = envelope.usuarioId ?? 'system';

        console.log(`[mantenimiento-rmq] 📨 Evento: ${routingKey}`);

        switch (routingKey) {
          case 'alquiler.started':
            await handleAlquilerStarted(payload, usuarioId);
            break;
          case 'devolucion.registered':
            await handleDevolucionRegistrada(payload, usuarioId);
            break;
          case 'vehiculo.updated':
            await handleVehiculoUpdated(payload, usuarioId);
            break;
        }

        channel!.ack(msg);
      } catch (err) {
        console.error('[mantenimiento-rmq] Error procesando mensaje:', err);
        channel!.nack(msg, false, false);
      }
    });

    console.log(`[mantenimiento-rmq] 🚀 Escuchando queue "${QUEUE_NAME}" (${BINDING_KEYS.join(', ')})`);

    (connection as any).on('error', () => scheduleReconnect(0));
    (connection as any).on('close', () => scheduleReconnect(0));

  } catch (err) {
    const delay = Math.min(1000 * 2 ** attempt, 30_000);
    console.warn(`[mantenimiento-rmq] RabbitMQ no disponible (intento ${attempt + 1}) — reintentando en ${delay}ms`);
    scheduleReconnect(attempt + 1, delay);
  }
}

function scheduleReconnect(attempt = 0, delay = 5000): void {
  channel    = null;
  connection = null;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => startConsumer(attempt), delay);
}

export async function startRabbitMQConsumer(): Promise<void> {
  await startConsumer();
}

export async function stopRabbitMQConsumer(): Promise<void> {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  try {
    await channel?.close();
    if (connection) await connection.close();
  } catch { /* ignorar */ }
}
