/**
 * grpc-server.ts — Servidor gRPC de financiero-service.
 *
 * Expone PagoService en el puerto 4003 (configurable via GRPC_PORT).
 * Permite a operaciones-service consultar estado de pago y solicitar generación de factura de forma síncrona.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { PagoRepository } from '../../modules/pagos/pago.repository.js';
import { FacturaRepository } from '../../modules/facturas/factura.repository.js';

const PROTO_PATH = path.join(__dirname, '..', '..', '..', 'proto', 'financiero.proto');
const GRPC_PORT  = process.env['GRPC_PORT'] ?? '4003';

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

function buildHandlers(pagoRepo: PagoRepository, facturaRepo: FacturaRepository) {
  return {
    // rpc GetPagoByReserva
    async GetPagoByReserva(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const { reserva_id } = call.request;
        const pagos = await pagoRepo.findByReservaId(reserva_id);

        if (!pagos || pagos.length === 0) {
          callback(null, {
            found:       false,
            pago_id:     '',
            reserva_id,
            monto:       0,
            metodo_pago: '',
            status:      'PENDIENTE',
            referencia:  '',
          });
          return;
        }

        // Preferir el completado, si no, el primero
        const completedPago = pagos.find(p => p.status === 'COMPLETADO') || pagos[0]!;

        callback(null, {
          found:       true,
          pago_id:     completedPago.id,
          reserva_id:  completedPago.reservaId,
          monto:       Number(completedPago.monto),
          metodo_pago: completedPago.metodoPago ?? '',
          status:      completedPago.status ?? 'PENDIENTE',
          referencia:  completedPago.referencia ?? '',
        });
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error interno en GetPagoByReserva',
        });
      }
    },

    // rpc GenerarFactura
    async GenerarFactura(
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
    ): Promise<void> {
      try {
        const req = call.request;
        
        if (!req.reserva_id) {
          callback(null, {
            success:        false,
            factura_id:     '',
            numero_factura: '',
            mensaje:        'reserva_id es requerido para generar la factura',
          });
          return;
        }

        const detalles = (req.detalles || []).map((d: any) => ({
          descripcion: d.descripcion ?? 'Servicio de renta',
          cantidad:    d.cantidad ?? 1,
          precioUnit:  d.precio_unit ? Number(d.precio_unit) : 0,
        }));

        if (detalles.length === 0) {
          callback(null, {
            success:        false,
            factura_id:     '',
            numero_factura: '',
            mensaje:        'Debe incluir al menos un detalle en la factura',
          });
          return;
        }

        const factura = await facturaRepo.create({
          reservaId:   req.reserva_id,
          pagoId:      req.pago_id || undefined,
          rucCliente:  req.ruc_cliente || undefined,
          razonSocial: req.razon_social || undefined,
          detalles,
        });

        callback(null, {
          success:        true,
          factura_id:     factura.id,
          numero_factura: factura.numeroFactura,
          mensaje:        'Factura generada exitosamente',
        });
      } catch (err: any) {
        callback({
          code:    grpc.status.INTERNAL,
          message: err?.message ?? 'Error interno al generar factura',
        });
      }
    },
  };
}

// ── Arranque del servidor gRPC ────────────────────────────────────────────────

let grpcServer: grpc.Server | null = null;

export function startGrpcServer(pagoRepo: PagoRepository, facturaRepo: FacturaRepository): void {
  grpcServer = new grpc.Server();

  grpcServer.addService(
    proto.zenith.financiero.v1.PagoService.service,
    buildHandlers(pagoRepo, facturaRepo),
  );

  grpcServer.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('[financiero-grpc] Error al iniciar servidor gRPC:', err);
        return;
      }
      console.log(`[financiero-grpc] 🚀 Servidor gRPC escuchando en puerto ${port}`);
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
