/**
 * grpc-server.ts — Servidor gRPC de auth-service.
 *
 * Expone AuthService en el puerto 4001 (configurable via GRPC_PORT).
 * Permite a otros servicios validar tokens JWT y verificar permisos.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import jwt from 'jsonwebtoken';
import { UsuarioRepository } from '../../modules/usuarios/usuario.repository.js';

const PROTO_PATH = path.join(__dirname, '..', '..', '..', 'proto', 'auth.proto');
const GRPC_PORT  = process.env['GRPC_PORT'] ?? '4001';

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

function buildHandlers(repo: UsuarioRepository) {
  return {
    // rpc ValidateToken
    async ValidateToken(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const { bearer_token } = call.request;
        if (!bearer_token) {
          callback(null, {
            valid:      false,
            user_id:    '',
            email:      '',
            rol:        '',
            expires_at: 0,
            mensaje:    'Token no proporcionado',
          });
          return;
        }

        try {
          const secret = process.env['JWT_SECRET']!;
          const payload = jwt.verify(bearer_token, secret) as any;

          callback(null, {
            valid:      true,
            user_id:    payload.id ?? '',
            email:      payload.email ?? '',
            rol:        payload.role ?? payload.rol ?? 'CLIENTE',
            expires_at: payload.exp ? Number(payload.exp) : 0,
            mensaje:    '',
          });
        } catch (err: any) {
          callback(null, {
            valid:      false,
            user_id:    '',
            email:      '',
            rol:        '',
            expires_at: 0,
            mensaje:    err?.message ?? 'Token inválido o expirado',
          });
        }
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error interno en ValidateToken',
        });
      }
    },

    // rpc CheckPermission
    async CheckPermission(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const { user_id, permission } = call.request;
        const user = await repo.findById(user_id);

        if (!user) {
          callback(null, {
            allowed: false,
            rol:     '',
            mensaje: `Usuario ${user_id} no encontrado`,
          });
          return;
        }

        if (!user.isActive) {
          callback(null, {
            allowed: false,
            rol:     user.role ?? 'CLIENTE',
            mensaje: 'Usuario inactivo',
          });
          return;
        }

        // Si se requiere permiso ADMIN y el usuario no lo es
        const userRole = user.role ?? 'CLIENTE';
        let allowed = false;

        if (permission === 'ADMIN') {
          allowed = userRole === 'ADMIN';
        } else {
          // Permisos genéricos, de momento permitimos si es ADMIN o si coincide con el rol
          allowed = userRole === 'ADMIN' || userRole === permission;
        }

        callback(null, {
          allowed,
          rol:     userRole,
          mensaje: allowed ? 'Permiso concedido' : 'Permiso denegado',
        });
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error interno en CheckPermission',
        });
      }
    },

    // rpc GetUserProfile
    async GetUserProfile(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const { user_id } = call.request;
        const user = await repo.findById(user_id);

        if (!user) {
          callback(null, {
            found:     false,
            id:        '',
            email:     '',
            nombre:    '',
            rol:       '',
            is_active: false,
            created_at: '',
          });
          return;
        }

        const nombre = `${user.nombres ?? ''} ${user.apellidos ?? ''}`.trim();

        callback(null, {
          found:     true,
          id:        user.id,
          email:     user.email,
          nombre:    nombre || 'Usuario',
          rol:       user.role ?? 'CLIENTE',
          is_active: user.isActive,
          created_at: user.createdAt?.toISOString() ?? '',
        });
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error interno en GetUserProfile',
        });
      }
    },
  };
}

// ── Arranque del servidor gRPC ────────────────────────────────────────────────

let grpcServer: grpc.Server | null = null;

export function startGrpcServer(repo: UsuarioRepository): void {
  grpcServer = new grpc.Server();

  grpcServer.addService(
    proto.zenith.auth.v1.AuthService.service,
    buildHandlers(repo),
  );

  grpcServer.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('[auth-grpc] Error al iniciar servidor gRPC:', err);
        return;
      }
      console.log(`[auth-grpc] 🚀 Servidor gRPC escuchando en puerto ${port}`);
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
