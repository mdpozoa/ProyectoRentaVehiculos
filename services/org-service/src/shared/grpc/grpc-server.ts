/**
 * grpc-server.ts — Servidor gRPC de org-service.
 *
 * Expone OrganizacionService en el puerto 4007 (configurable via GRPC_PORT).
 * Permite a otros servicios (como operaciones o inventario) validar agencias de forma síncrona.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { OrganizacionRepository } from '../../modules/organizaciones/organizacion.repository.js';

const PROTO_PATH = path.join(__dirname, '..', '..', '..', 'proto', 'org.proto');
const GRPC_PORT  = process.env['GRPC_PORT'] ?? '4007';

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

function buildHandlers(repo: OrganizacionRepository) {
  return {
    // rpc GetAgencia
    async GetAgencia(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const { agencia_id } = call.request;
        const agencia = await repo.findAgenciaById(agencia_id);

        if (!agencia) {
          callback(null, {
            found:     false,
            id:        '',
            nombre:    '',
            direccion: '',
            ciudad:    '',
            is_active: false,
            empresa_id: '',
          });
          return;
        }

        callback(null, {
          found:      true,
          id:         agencia.id,
          nombre:     agencia.nombre ?? '',
          direccion:  agencia.direccion ?? '',
          ciudad:     agencia.ciudad?.nombre ?? '',
          is_active:  agencia.isActive,
          empresa_id: agencia.empresaId ?? '',
        });
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error interno en GetAgencia',
        });
      }
    },

    // rpc ListAgenciasActivas
    async ListAgenciasActivas(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const { empresa_id } = call.request;
        
        // Paginado muy amplio (e.g. 500) para traer todas las agencias activas
        const result = await repo.findAllAgencias(1, 500, empresa_id || undefined);
        
        const agencias = result.data.map(agencia => ({
          id:        agencia.id,
          nombre:    agencia.nombre ?? '',
          ciudad:    agencia.ciudad?.nombre ?? '',
          direccion: agencia.direccion ?? '',
        }));

        callback(null, { agencias });
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error interno en ListAgenciasActivas',
        });
      }
    },
  };
}

// ── Arranque del servidor gRPC ────────────────────────────────────────────────

let grpcServer: grpc.Server | null = null;

export function startGrpcServer(repo: OrganizacionRepository): void {
  grpcServer = new grpc.Server();

  grpcServer.addService(
    proto.zenith.org.v1.OrganizacionService.service,
    buildHandlers(repo),
  );

  grpcServer.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('[org-grpc] Error al iniciar servidor gRPC:', err);
        return;
      }
      console.log(`[org-grpc] 🚀 Servidor gRPC escuchando en puerto ${port}`);
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
