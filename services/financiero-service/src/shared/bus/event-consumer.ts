/**
 * event-consumer.ts — Suscriptor Azure Service Bus para financiero-service.
 *
 * Escucha los eventos del topic `urbancar-eventos` (subscription: financiero-sub)
 * y reacciona automáticamente:
 *   - DEVOLUCION_REGISTRADA → genera factura automática
 *   - PAGO_COMPLETADO       → (futuro: confirmar reserva vía callback)
 */

import { ServiceBusClient, ServiceBusReceiver } from '@azure/service-bus';
import {
  IntegrationEvent,
  DevolucionRegistradaPayload,
  PagoPayload,
} from './event-types.js';
import { FacturaRepository } from '../../modules/facturas/factura.repository.js';
import { PagoRepository }    from '../../modules/pagos/pago.repository.js';
import prisma from '../database/prisma.js';

const TOPIC_NAME        = process.env['AZURE_SERVICEBUS_TOPIC']        ?? 'urbancar-eventos';
const SUBSCRIPTION_NAME = process.env['AZURE_SERVICEBUS_SUBSCRIPTION']  ?? 'financiero-sub';
const CONN_STR          = process.env['AZURE_SERVICEBUS_CONNECTION_STRING'];

let receiver: ServiceBusReceiver | null = null;
const facturaRepo = new FacturaRepository(prisma);
const pagoRepo    = new PagoRepository(prisma);

// ── Handlers de eventos ───────────────────────────────────────────────────────

/**
 * Cuando se registra una devolución, genera la factura automáticamente
 * si no existe una previa para esa reserva.
 */
async function handleDevolucionRegistrada(
  payload: DevolucionRegistradaPayload,
): Promise<void> {
  const { alquilerId, reservaId, vehiculoId, cargoExtra = 0 } = payload;

  if (!reservaId) {
    console.warn('[financiero-consumer] DEVOLUCION_REGISTRADA sin reservaId — omitiendo generación de factura');
    return;
  }

  // Verificar si ya existe una factura para esta reserva
  const facturas = await facturaRepo.findAll(1, 1, reservaId);
  if (facturas.total > 0) {
    console.log(`[financiero-consumer] Ya existe factura para reserva ${reservaId} — omitiendo`);
    return;
  }

  // Buscar pagos de la reserva para obtener el monto
  const pagos = await pagoRepo.findByReservaId(reservaId);
  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
  const pagoId      = pagos.find(p => p.status === 'COMPLETADO')?.id;

  const montoBase   = totalPagado > 0 ? totalPagado : 45; // fallback al precio mínimo
  const montoFinal  = montoBase + Number(cargoExtra);

  const detalles = [
    {
      descripcion: `Servicio de alquiler de vehículo — Alquiler #${alquilerId.slice(0, 8)}`,
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

  const factura = await facturaRepo.create({
    reservaId,
    pagoId,
    detalles,
  });

  console.log(`[financiero-consumer] ✅ Factura ${factura.numeroFactura} generada para reserva ${reservaId}`);
}

/**
 * Cuando un pago se completa, registra el evento en logs.
 * (Futuro: podría confirmar la reserva vía HTTP a operaciones-service)
 */
async function handlePagoCompletado(payload: PagoPayload): Promise<void> {
  console.log(`[financiero-consumer] ✅ Pago ${payload.pagoId} completado para reserva ${payload.reservaId} — monto: $${payload.monto}`);
  // TODO: Notificar a operaciones-service via gRPC para confirmar reserva
}

async function handlePagoFallido(payload: PagoPayload): Promise<void> {
  console.warn(`[financiero-consumer] ❌ Pago ${payload.pagoId} fallido para reserva ${payload.reservaId}: ${payload.motivoFalla}`);
  // TODO: Notificar a operaciones-service para cancelar reserva automáticamente
}

// ── Inicialización del consumer ───────────────────────────────────────────────

export async function startEventConsumer(): Promise<void> {
  if (!CONN_STR) {
    console.warn('[financiero-consumer] AZURE_SERVICEBUS_CONNECTION_STRING no configurado — consumer inactivo');
    return;
  }

  try {
    const client = new ServiceBusClient(CONN_STR);
    receiver = client.createReceiver(TOPIC_NAME, SUBSCRIPTION_NAME);

    receiver.subscribe({
      processMessage: async (message) => {
        const event = message.body as IntegrationEvent;
        console.log(`[financiero-consumer] 📨 Evento recibido: ${event.tipo} — entidad: ${event.entidadId}`);

        try {
          switch (event.tipo) {
            case 'DEVOLUCION_REGISTRADA':
              await handleDevolucionRegistrada(event.payload as unknown as DevolucionRegistradaPayload);
              break;
            case 'PAGO_COMPLETADO':
              await handlePagoCompletado(event.payload as unknown as PagoPayload);
              break;
            case 'PAGO_FALLIDO':
              await handlePagoFallido(event.payload as unknown as PagoPayload);
              break;
            default:
              // Ignorar eventos no relevantes para este servicio
              break;
          }
        } catch (handlerErr) {
          console.error(`[financiero-consumer] Error procesando evento ${event.tipo}:`, handlerErr);
          // No relanzamos — el mensaje se marcará como completado de todas formas
          // para evitar bucles infinitos de reintento
        }
      },

      processError: async (err) => {
        console.error('[financiero-consumer] Error en el receiver de Azure Service Bus:', err.error);
      },
    });

    console.log(`[financiero-consumer] 🚀 Escuchando topic "${TOPIC_NAME}" / subscription "${SUBSCRIPTION_NAME}"`);

  } catch (err) {
    console.error('[financiero-consumer] Error al inicializar el consumer:', err);
  }
}

export async function stopEventConsumer(): Promise<void> {
  if (receiver) {
    await receiver.close();
    console.log('[financiero-consumer] Consumer cerrado');
  }
}
