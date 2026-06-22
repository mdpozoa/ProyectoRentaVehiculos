/**
 * grpc-server.ts — Servidor gRPC de inventario-service.
 *
 * Expone VehiculoService en el puerto 4004 (configurable via GRPC_PORT).
 * Permite a operaciones-service consultar disponibilidad en tiempo real
 * con baja latencia, reemplazando las llamadas HTTP inter-servicio.
 *
 * Uso:
 *   import { startGrpcServer } from './shared/grpc/grpc-server.js';
 *   startGrpcServer();
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { VehiculoRepository } from '../../modules/vehiculos/vehiculo.repository.js';

const PROTO_PATH = path.join(__dirname, '..', '..', '..', 'proto', 'inventario.proto');
const GRPC_PORT  = process.env['GRPC_PORT'] ?? '4004';

// ── Carga del .proto ──────────────────────────────────────────────────────────
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase:     true,
  longs:        String,
  enums:        String,
  defaults:     true,
  oneofs:       true,
});

const proto = grpc.loadPackageDefinition(packageDef) as any;

// ── Implementación de los handlers ────────────────────────────────────────────

function buildHandlers(repo: VehiculoRepository) {
  return {

    // rpc CheckDisponibilidad
    async CheckDisponibilidad(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const { vehiculo_id } = call.request;
        const vehiculo = await repo.findById(vehiculo_id);

        if (!vehiculo) {
          callback(null, {
            disponible:  false,
            vehiculo_id,
            status:      'NOT_FOUND',
            precio_dia:  0,
            agencia_id:  '',
            mensaje:     `Vehículo ${vehiculo_id} no encontrado en inventario`,
          });
          return;
        }

        const disponible = vehiculo.status === 'DISPONIBLE' && vehiculo.isActive === true;

        callback(null, {
          disponible,
          vehiculo_id:  vehiculo.id,
          status:       vehiculo.status,
          precio_dia:   Number(vehiculo.precioDia ?? 45),
          agencia_id:   vehiculo.agenciaId ?? '',
          mensaje:      disponible
            ? 'El vehículo está disponible'
            : `No disponible: estado=${vehiculo.status}`,
        });
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error interno',
        });
      }
    },

    // rpc UpdateEstado
    async UpdateEstado(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const { vehiculo_id, nuevo_estado } = call.request;
        const vehiculo = await repo.findById(vehiculo_id);

        if (!vehiculo) {
          callback({ code: grpc.status.NOT_FOUND, message: `Vehículo ${vehiculo_id} no encontrado` });
          return;
        }

        const estadoPrevio = vehiculo.status;
        await repo.update(vehiculo_id, { status: nuevo_estado });

        callback(null, {
          success:       true,
          vehiculo_id,
          estado_previo: estadoPrevio,
          estado_nuevo:  nuevo_estado,
          mensaje:       `Estado actualizado: ${estadoPrevio} → ${nuevo_estado}`,
        });
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error al actualizar estado',
        });
      }
    },

    // rpc GetVehiculoInfo
    async GetVehiculoInfo(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const { vehiculo_id } = call.request;
        const vehiculo = await repo.findById(vehiculo_id);

        if (!vehiculo) {
          callback({ code: grpc.status.NOT_FOUND, message: `Vehículo ${vehiculo_id} no encontrado` });
          return;
        }

        const marca   = (vehiculo as any).modelo?.marca?.nombre ?? '';
        const modelo  = (vehiculo as any).modelo?.nombre ?? '';
        const anio    = (vehiculo as any).anio ?? '';

        callback(null, {
          vehiculo_id:  vehiculo.id,
          placa:        vehiculo.placa ?? '',
          nombre:       `${marca} ${modelo} ${anio}`.trim(),
          categoria:    (vehiculo as any).categoria?.nombre ?? '',
          precio_dia:   Number(vehiculo.precioDia ?? 45),
          agencia_id:   vehiculo.agenciaId ?? '',
          imagen_url:   vehiculo.imagenUrl ?? '',
          status:       vehiculo.status ?? 'DISPONIBLE',
          is_active:    vehiculo.isActive ?? true,
        });
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error al obtener vehículo',
        });
      }
    },
  };
}

// ── Arranque del servidor gRPC ────────────────────────────────────────────────

let grpcServer: grpc.Server | null = null;

export function startGrpcServer(repo: VehiculoRepository): void {
  grpcServer = new grpc.Server();

  grpcServer.addService(
    proto.zenith.inventario.v1.VehiculoService.service,
    buildHandlers(repo),
  );

  grpcServer.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('[inventario-grpc] Error al iniciar servidor gRPC:', err);
        return;
      }
      console.log(`[inventario-grpc] 🚀 Servidor gRPC escuchando en puerto ${port}`);
    },
  );
}

export function stopGrpcServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!grpcServer) { resolve(); return; }
    grpcServer.tryShutdown(err => {
      if (err) reject(err);
      else resolve();
    });
  });
}
