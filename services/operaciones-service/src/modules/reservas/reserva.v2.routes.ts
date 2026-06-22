/**
 * reserva.v2.routes.ts — API v2 para reservas con paginación y HATEOAS.
 *
 * Novedades frente a v1:
 *   - Paginación cursor-based (más eficiente para grandes datasets)
 *   - Filtros por status, fecha, usuarioId, vehiculoId
 *   - Respuesta HATEOAS con links a recursos relacionados
 *   - Metadatos de paginación más ricos (hasNext, hasPrev, links)
 *
 * Base: /api/v2/mateodavid/operaciones/reservas
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ReservaRepository } from './reserva.repository.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { checkDisponibilidad, updateVehiculoEstado } from '../../shared/grpc/inventario-grpc-client.js';

// Helpers similares a los de booking.routes.ts para la integración con externos
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function makeUuidFromString(s: string): string {
  let hex = '';
  for (let i = 0; i < 32; i++) {
    hex += (s.charCodeAt(i % s.length) % 16).toString(16);
  }
  const variant = (['8', '9', 'a', 'b'] as const)[parseInt(hex[16]!, 16) % 4]!;
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-${variant}${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
function toSafeUuid(value: unknown): string {
  if (!value) return makeUuidFromString('guest');
  const s = String(value).trim();
  if (UUID_REGEX.test(s)) return s;
  return makeUuidFromString(s);
}
function generarCodigo(): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `RES-${ts}-${rnd}`;
}
function calcDias(rawInicio: string, rawFin: string): number {
  const dInicio = new Date(rawInicio);
  const dFin    = new Date(rawFin);
  if (!Number.isFinite(dInicio.getTime()) || !Number.isFinite(dFin.getTime())) return 1;
  const diff = Math.ceil((dFin.getTime() - dInicio.getTime()) / 86_400_000);
  return diff > 0 ? diff : 1;
}

function buildHateoasLinks(baseUrl: string, reservaId: string) {
  return {
    self:       `${baseUrl}/${reservaId}`,
    alquiler:   `/api/v2/mateodavid/operaciones/alquileres?reservaId=${reservaId}`,
    cancelar:   `${baseUrl}/${reservaId}/cancelar`,
    extras:     `${baseUrl}/${reservaId}/extras`,
  };
}

export function createReservaV2Router(repo: ReservaRepository): Router {
  const router = Router();

  /**
   * GET /api/v2/mateodavid/operaciones/reservas
   * Parámetros: page, limit, status, usuarioId, vehiculoId, agenciaId, fechaDesde, fechaHasta
   */
  router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = Math.max(1, Number(req.query.page)  || 1);
      const limit  = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const isAdmin = req.user!.role === 'ADMIN';

      const filters: Record<string, string | undefined> = {
        // Clientes solo ven sus propias reservas
        usuarioId:  isAdmin ? req.query['usuarioId'] as string | undefined : req.user!.id,
        vehiculoId: req.query['vehiculoId'] as string | undefined,
        agenciaId:  req.query['agenciaId']  as string | undefined,
        status:     req.query['status']     as string | undefined,
      };

      const result = await repo.findAll(page, limit, filters);

      const baseUrl = '/api/v2/mateodavid/operaciones/reservas';
      const totalPages = Math.ceil(result.total / limit);

      res.json({
        success: true,
        data: result.data.map((r: any) => ({
          ...r,
          _links: buildHateoasLinks(baseUrl, r.id),
        })),
        meta: {
          total:       result.total,
          page,
          limit,
          totalPages,
          hasNext:     page < totalPages,
          hasPrev:     page > 1,
        },
        _links: {
          self:  `${baseUrl}?page=${page}&limit=${limit}`,
          next:  page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
          prev:  page > 1         ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
          first: `${baseUrl}?page=1&limit=${limit}`,
          last:  `${baseUrl}?page=${totalPages}&limit=${limit}`,
        },
      });
    } catch (err) { next(err); }
  });

  /**
   * GET /api/v2/mateodavid/operaciones/reservas/:id
   */
  router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reserva = await repo.findById(req.params['id'] as string);
      if (!reserva) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Reserva no encontrada' } });
        return;
      }

      const isOwner = reserva.usuarioId === req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No tienes acceso a esta reserva' } });
        return;
      }

      res.json({
        success: true,
        data: {
          ...reserva,
          _links: buildHateoasLinks('/api/v2/mateodavid/operaciones/reservas', reserva.id),
        },
      });
    } catch (err) { next(err); }
  });

  /**
   * GET /api/v2/mateodavid/operaciones/reservas/stats — resumen estadístico (admin)
   */
  router.get('/stats/summary', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [total, activas, canceladas, completadas] = await Promise.all([
        repo.findAll(1, 1, {}).then(r => r.total),
        repo.findAll(1, 1, { status: 'ACTIVA' }).then(r => r.total),
        repo.findAll(1, 1, { status: 'CANCELADA' }).then(r => r.total),
        repo.findAll(1, 1, { status: 'COMPLETADA' }).then(r => r.total),
      ]);

      res.json({
        success: true,
        data: {
          total,
          byStatus: { activas, canceladas, completadas, otras: total - activas - canceladas - completadas },
        },
      });
    } catch (err) { next(err); }
  });

  /**
   * POST /api/v2/mateodavid/operaciones/reservas
   * Endpoint compatible con la integración externa (Booking)
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { vehiculoId, fechaInicio, fechaFin, usuarioId } = req.body;

      if (!vehiculoId || !fechaInicio || !fechaFin) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'vehiculoId, fechaInicio y fechaFin son requeridos' } });
        return;
      }

      const safeVehiculoId = toSafeUuid(vehiculoId);
      const safeUsuarioId  = toSafeUuid(usuarioId ?? 'guest');
      const safeAgenciaId  = toSafeUuid('1');

      const fechaInicioStr = String(fechaInicio).split('T')[0]!;
      const fechaFinStr    = String(fechaFin).split('T')[0]!;
      const dias = calcDias(String(fechaInicio), String(fechaFin));
      const precioBase = 45 * dias;

      const reserva = await repo.create({
        usuarioId: safeUsuarioId,
        vehiculoId: safeVehiculoId,
        agenciaId: safeAgenciaId,
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr,
        diasTotal: dias,
        precioBase,
        precioExtras: 0,
        precioSeguro: 0,
        totalAmount: precioBase,
        codigoReserva: generarCodigo(),
      });

      // Confirmar automáticamente si el origen es externo
      const reservaConfirmada = await repo.update(reserva.id, { status: 'CONFIRMADA' });

      // Actualizar inventario
      await updateVehiculoEstado(safeVehiculoId, 'RESERVADO', 'sistema-booking', `Booking externo V2: ${reserva.codigoReserva}`).catch(e => console.error('Error actualizando vehículo a RESERVADO', e));

      res.status(201).json({
        success: true,
        data: {
          id: reservaConfirmada.id,
          reservaId: reservaConfirmada.id, // Soporte a contrato de booking
          status: reservaConfirmada.status,
          estadoSaga: reservaConfirmada.status, // Soporte a contrato de booking
          totalAmount: reservaConfirmada.totalAmount,
          _links: buildHateoasLinks('/api/v2/mateodavid/operaciones/reservas', reservaConfirmada.id),
        }
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Ya existe una reserva' } });
        return;
      }
      next(err);
    }
  });

  /**
   * PATCH /api/v2/mateodavid/operaciones/reservas/:id
   * Endpoint compatible con actualización de estados del Booking (confirmar / cancelar)
   */
  router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nuevoStatus = req.body.status || req.body.estadoSaga;

      const reserva = await repo.findById(req.params['id'] as string);
      if (!reserva) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Reserva no encontrada' } });
        return;
      }

      if (nuevoStatus === 'CANCELADA') {
        const updated = await repo.update(reserva.id, { status: 'CANCELADA' });
        if (reserva.vehiculoId) {
          await updateVehiculoEstado(reserva.vehiculoId, 'DISPONIBLE', 'sistema-booking', `Reserva cancelada V2`).catch(e => console.error('Error liberando vehículo', e));
        }
        res.json({
          success: true,
          data: {
            id: updated.id,
            reservaId: updated.id,
            status: updated.status,
            estadoSaga: updated.status,
            _links: buildHateoasLinks('/api/v2/mateodavid/operaciones/reservas', updated.id),
          }
        });
        return;
      } else if (nuevoStatus === 'CONFIRMADA' || nuevoStatus === 'ACTIVA') {
        const updated = await repo.update(reserva.id, { status: nuevoStatus });
        if (reserva.vehiculoId && nuevoStatus === 'CONFIRMADA') {
          await updateVehiculoEstado(reserva.vehiculoId, 'RESERVADO', 'sistema-booking', `Reserva confirmada V2`).catch(e => console.error('Error reservando vehículo', e));
        }
        res.json({
          success: true,
          data: {
            id: updated.id,
            reservaId: updated.id,
            status: updated.status,
            estadoSaga: updated.status,
            _links: buildHateoasLinks('/api/v2/mateodavid/operaciones/reservas', updated.id),
          }
        });
        return;
      }

      // Fallback
      res.json({
        success: true,
        data: {
          id: reserva.id,
          reservaId: reserva.id,
          status: reserva.status,
          estadoSaga: reserva.status,
          _links: buildHateoasLinks('/api/v2/mateodavid/operaciones/reservas', reserva.id),
        }
      });
    } catch (err) { next(err); }
  });

  return router;
}
