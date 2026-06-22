/**
 * inventario-grpc-client.ts — Cliente gRPC para inventario-service.
 *
 * Permite a operaciones-service consultar disponibilidad de vehículos
 * con baja latencia antes de crear reservas, eliminando la dependencia
 * de HTTP polling al inventario-service.
 *
 * Si el servidor gRPC no está disponible, hace fallback silencioso
 * para no romper el flujo de reservas existente.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// Ruta al proto (relativa desde src/shared/grpc/ → proto/)
const PROTO_PATH = path.join(__dirname, '..', '..', '..', 'proto', 'inventario.proto');

const INVENTARIO_GRPC_HOST = process.env['INVENTARIO_GRPC_HOST'] ?? 'localhost';
const INVENTARIO_GRPC_PORT = process.env['INVENTARIO_GRPC_PORT'] ?? '4004';
const GRPC_ADDRESS         = `${INVENTARIO_GRPC_HOST}:${INVENTARIO_GRPC_PORT}`;

// ── Carga del .proto ──────────────────────────────────────────────────────────
let client: any = null;

function getClient(): any {
  if (client) return client;

  try {
    const packageDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs:    String,
      enums:    String,
      defaults: true,
      oneofs:   true,
    });

    const proto = grpc.loadPackageDefinition(packageDef) as any;

    client = new proto.zenith.inventario.v1.VehiculoService(
      GRPC_ADDRESS,
      grpc.credentials.createInsecure(),
    );

    console.log(`[inventario-grpc-client] Conectado a ${GRPC_ADDRESS}`);
  } catch (err) {
    console.warn('[inventario-grpc-client] No se pudo inicializar cliente gRPC:', err);
  }

  return client;
}

// ── Tipos de respuesta ────────────────────────────────────────────────────────

export interface DisponibilidadResult {
  disponible:  boolean;
  vehiculo_id: string;
  status:      string;
  precio_dia:  number;
  agencia_id:  string;
  mensaje:     string;
}

export interface UpdateEstadoResult {
  success:       boolean;
  vehiculo_id:   string;
  estado_previo: string;
  estado_nuevo:  string;
  mensaje:       string;
}

// ── Métodos del cliente ───────────────────────────────────────────────────────

/**
 * Verifica si un vehículo está disponible para el rango de fechas dado.
 * Retorna null si el servidor gRPC no está disponible (fallback graceful).
 */
export async function checkDisponibilidad(
  vehiculoId:  string,
  fechaInicio: string,
  fechaFin:    string,
): Promise<DisponibilidadResult | null> {
  const c = getClient();
  if (!c) return null;

  return new Promise((resolve) => {
    const deadline = new Date(Date.now() + 3000); // 3 segundos timeout

    c.CheckDisponibilidad(
      { vehiculo_id: vehiculoId, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      { deadline },
      (err: grpc.ServiceError | null, response: DisponibilidadResult) => {
        if (err) {
          console.warn(`[inventario-grpc-client] CheckDisponibilidad error (fallback):`, err.message);
          resolve(null); // fallback: no bloquear el flujo
        } else {
          resolve(response);
        }
      },
    );
  });
}

/**
 * Actualiza el estado de un vehículo en inventario-service vía gRPC.
 * Retorna null si el servidor gRPC no está disponible.
 */
export async function updateVehiculoEstado(
  vehiculoId:  string,
  nuevoEstado: string,
  usuarioId:   string,
  motivo:      string,
  correlationId?: string,
): Promise<UpdateEstadoResult | null> {
  const c = getClient();
  if (!c) return null;

  return new Promise((resolve) => {
    const deadline = new Date(Date.now() + 3000);

    c.UpdateEstado(
      {
        vehiculo_id:    vehiculoId,
        nuevo_estado:   nuevoEstado,
        usuario_id:     usuarioId,
        motivo,
        correlation_id: correlationId ?? '',
      },
      { deadline },
      (err: grpc.ServiceError | null, response: UpdateEstadoResult) => {
        if (err) {
          console.warn(`[inventario-grpc-client] UpdateEstado error (fallback):`, err.message);
          resolve(null);
        } else {
          resolve(response);
        }
      },
    );
  });
}
