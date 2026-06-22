/**
 * rabbitmq-consumer.ts — Consumer de RabbitMQ para financiero-service.
 *
 * Se suscribe al exchange `urbancar-events` con routing keys relevantes:
 *   - reserva.created        → registra el pago pendiente
 *   - devolucion.registered  → genera factura automáticamente
 *
 * Queue: financiero-events (durable, no auto-delete)
 */

import * as amqplib from 'amqplib';
import { FacturaRepository } from '../../modules/facturas/factura.repository.js';
import { PagoRepository }    from '../../modules/pagos/pago.repository.js';
import prisma from '../database/prisma.js';

const EXCHANGE_NAME = 'urbancar-events';
const QUEUE_NAME    = 'financiero-events';
const BINDING_KEYS  = ['reserva.created', 'devolucion.registered'];

const RABBITMQ_URL = () => process.env['RABBITMQ_URL'] ?? 'amqp://guest:guest@localhost:5672';

let connection: amqplib.ChannelModel | null = null;
let channel: amqplib.Channel | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const facturaRepo = new FacturaRepository(prisma);
const pagoRepo    = new PagoRepository(prisma);

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleReservaCreada(payload: Record<string, unknown>): Promise<void> {
  const { vehiculoId, totalAmount, reservaId } = payload;
  console.log(`[financiero-rmq] 📋 Reserva creada — vehículo: ${vehiculoId}, total: $${totalAmount}, reserva: ${reservaId}`);
  // Aquí se podría crear un pago pendiente automáticamente si se desea
}

async function handleDevolucionRegistrada(payload: Record<string, unknown>): Promise<void> {
  const { alquilerId, reservaId, vehiculoId, cargoExtra = 0 } = payload;

  if (!reservaId) {
    console.warn('[financiero-rmq] DEVOLUCION sin reservaId — omitiendo factura');
    return;
  }

  // Verificar si ya existe factura
  const facturas = await facturaRepo.findAll(1, 1, reservaId as string);
  if (facturas.total > 0) {
    console.log(`[financiero-rmq] Factura ya existe para reserva ${reservaId}`);
    return;
  }

  const pagos = await pagoRepo.findByReservaId(reservaId as string);
  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
  const pagoId      = pagos.find((p: any) => p.status === 'COMPLETADO')?.id;

  const montoBase  = totalPagado > 0 ? totalPagado : 45;
  const montoFinal = montoBase + Number(cargoExtra);

  const detalles: any[] = [
    {
      descripcion: `Servicio de alquiler — Alquiler #${String(alquilerId).slice(0, 8)}`,
      cantidad:    1,
      precioUnit:  montoBase,
    },
  ];

  if (Number(cargoExtra) > 0) {
    detalles.push({
      descripcion: 'Cargo adicional por condición del vehículo',
      cantidad:    1,
      precioUnit:  Number(cargoExtra),
    });
  }

  const factura = await facturaRepo.create({ reservaId: reservaId as string, pagoId, detalles });
  console.log(`[financiero-rmq] ✅ Factura ${factura.numeroFactura} generada — reserva: ${reservaId} ($${montoFinal})`);
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
        const payload = JSON.parse(msg.content.toString()) as Record<string, unknown>;
        const routingKey = msg.fields.routingKey;
        console.log(`[financiero-rmq] 📨 Evento recibido: ${routingKey}`);

        switch (routingKey) {
          case 'reserva.created':
            await handleReservaCreada(payload);
            break;
          case 'devolucion.registered':
            await handleDevolucionRegistrada(payload);
            break;
        }

        channel!.ack(msg);
      } catch (err) {
        console.error('[financiero-rmq] Error procesando mensaje:', err);
        channel!.nack(msg, false, false); // dead-letter sin requeue
      }
    });

    console.log(`[financiero-rmq] 🚀 Escuchando queue "${QUEUE_NAME}" (${BINDING_KEYS.join(', ')})`);

    (connection as any).on('error',  () => scheduleReconnect(0));
    (connection as any).on('close',  () => scheduleReconnect(0));

  } catch (err) {
    const delay = Math.min(1000 * 2 ** attempt, 30_000);
    console.warn(`[financiero-rmq] RabbitMQ no disponible (intento ${attempt + 1}) — reintentando en ${delay}ms`);
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
