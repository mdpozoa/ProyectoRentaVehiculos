/**
 * event-consumer.ts — Suscriptor Azure Service Bus para mantenimiento-service.
 *
 * Escucha los eventos del topic `urbancar-eventos` (subscription: mantenimiento-sub)
 * y reacciona automáticamente:
 *   - DEVOLUCION_REGISTRADA → crea entrada de Kardex con el historial de estado
 *   - ALQUILER_INICIADO     → registra en Kardex que el vehículo pasó a EN_USO
 */

import { ServiceBusClient, ServiceBusReceiver } from '@azure/service-bus';
import {
  IntegrationEvent,
  DevolucionRegistradaPayload,
  AlquilerIniciadoPayload,
} from './event-types.js';
import { KardexRepository } from '../../modules/kardex/kardex.repository.js';
import prisma from '../database/prisma.js';

const TOPIC_NAME        = process.env['AZURE_SERVICEBUS_TOPIC']        ?? 'urbancar-eventos';
const SUBSCRIPTION_NAME = process.env['AZURE_SERVICEBUS_SUBSCRIPTION']  ?? 'mantenimiento-sub';
const CONN_STR          = process.env['AZURE_SERVICEBUS_CONNECTION_STRING'];

let receiver: ServiceBusReceiver | null = null;
const kardexRepo = new KardexRepository(prisma);

// ── Handlers de eventos ───────────────────────────────────────────────────────

/**
 * Al registrar devolución: crea una entrada de Kardex que documenta
 * el retorno del vehículo y su estado final.
 */
async function handleDevolucionRegistrada(
  payload:  DevolucionRegistradaPayload,
  usuarioId: string,
): Promise<void> {
  const { vehiculoId, alquilerId, estadoVehiculo, kmEntrada, observaciones } = payload;

  if (!vehiculoId) {
    console.warn('[mantenimiento-consumer] DEVOLUCION_REGISTRADA sin vehiculoId — omitiendo kardex');
    return;
  }

  // Determinar si el vehículo necesita mantenimiento según estado reportado
  const necesitaMantenimiento =
    estadoVehiculo &&
    ['MALO', 'DANADO', 'REQUIERE_MANTENIMIENTO', 'DAÑADO'].includes(
      estadoVehiculo.toUpperCase(),
    );

  const estadoNuevo = necesitaMantenimiento ? 'MANTENIMIENTO' : 'DISPONIBLE';

  await kardexRepo.create({
    vehiculoId,
    evento:         'DEVOLUCION',
    estadoAnterior: 'EN_USO',
    estadoNuevo,
    usuarioId:      usuarioId || 'system',
    referencia:     alquilerId,
    ...(kmEntrada       && { observaciones: `KM entrada: ${kmEntrada}` }),
    ...(observaciones   && { observaciones }),
  });

  console.log(
    `[mantenimiento-consumer] ✅ Kardex creado: vehículo ${vehiculoId} → ${estadoNuevo} (alquiler: ${alquilerId})`,
  );

  if (necesitaMantenimiento) {
    console.warn(
      `[mantenimiento-consumer] ⚠️ Vehículo ${vehiculoId} requiere atención: estado="${estadoVehiculo}"`,
    );
  }
}

/**
 * Al iniciar un alquiler: registra en Kardex que el vehículo pasó a EN_USO.
 */
async function handleAlquilerIniciado(
  payload:   AlquilerIniciadoPayload,
  usuarioId: string,
): Promise<void> {
  const { vehiculoId, alquilerId, kmSalida } = payload;

  if (!vehiculoId) {
    console.warn('[mantenimiento-consumer] ALQUILER_INICIADO sin vehiculoId — omitiendo kardex');
    return;
  }

  await kardexRepo.create({
    vehiculoId,
    evento:         'SALIDA_ALQUILER',
    estadoAnterior: 'DISPONIBLE',
    estadoNuevo:    'EN_USO',
    usuarioId:      usuarioId || 'system',
    referencia:     alquilerId,
    ...(kmSalida !== undefined && { observaciones: `KM salida: ${kmSalida}` }),
  });

  console.log(
    `[mantenimiento-consumer] ✅ Kardex creado: vehículo ${vehiculoId} → EN_USO (alquiler: ${alquilerId})`,
  );
}

// ── Inicialización del consumer ───────────────────────────────────────────────

export async function startEventConsumer(): Promise<void> {
  if (!CONN_STR) {
    console.warn('[mantenimiento-consumer] AZURE_SERVICEBUS_CONNECTION_STRING no configurado — consumer inactivo');
    return;
  }

  try {
    const client = new ServiceBusClient(CONN_STR);
    receiver = client.createReceiver(TOPIC_NAME, SUBSCRIPTION_NAME);

    receiver.subscribe({
      processMessage: async (message) => {
        const event = message.body as IntegrationEvent;
        console.log(`[mantenimiento-consumer] 📨 Evento: ${event.tipo} — entidad: ${event.entidadId}`);

        try {
          switch (event.tipo) {
            case 'DEVOLUCION_REGISTRADA':
              await handleDevolucionRegistrada(
                event.payload as unknown as DevolucionRegistradaPayload,
                event.usuarioId,
              );
              break;
            case 'ALQUILER_INICIADO':
              await handleAlquilerIniciado(
                event.payload as unknown as AlquilerIniciadoPayload,
                event.usuarioId,
              );
              break;
            default:
              break; // Ignorar eventos no relevantes
          }
        } catch (handlerErr) {
          console.error(`[mantenimiento-consumer] Error procesando ${event.tipo}:`, handlerErr);
        }
      },

      processError: async (err) => {
        console.error('[mantenimiento-consumer] Error Azure Service Bus receiver:', err.error);
      },
    });

    console.log(`[mantenimiento-consumer] 🚀 Escuchando topic "${TOPIC_NAME}" / subscription "${SUBSCRIPTION_NAME}"`);

  } catch (err) {
    console.error('[mantenimiento-consumer] Error al inicializar consumer:', err);
  }
}

export async function stopEventConsumer(): Promise<void> {
  if (receiver) {
    await receiver.close();
    console.log('[mantenimiento-consumer] Consumer cerrado');
  }
}
