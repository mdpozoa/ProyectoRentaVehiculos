/**
 * vehiculo-booking.routes.ts
 * Rutas de integración con el sistema de booking externo.
 * Usa MonolithACL para todas las consultas al sistema legado.
 */
import { Router } from 'express';
import { VehiculoRepository } from '../vehiculos/vehiculo.repository.js';
import {
  listVehiculos,
  getVehiculo,
  updateVehiculoStatus,
  clearMonolithCache,
} from '../../shared/acl/monolith-acl.js';

export function createVehiculoBookingRouter(_repo: VehiculoRepository): Router {
  const router = Router();

  // GET /api/v1/mateodavid/vehiculos/booking
  // Lista vehículos del monolito con soporte de filtro por status
  router.get('/', async (req, res, next) => {
    try {
      const statusQuery     = req.query['status'] as string | undefined;
      const soloDisponibles = !statusQuery; // si no hay filtro, solo disponibles

      let vehiculos = await listVehiculos(soloDisponibles);

      if (statusQuery) {
        vehiculos = vehiculos.filter(v =>
          v.status.toUpperCase() === statusQuery.toUpperCase(),
        );
      }

      res.json({
        success: true,
        data: {
          data:       vehiculos,
          total:      vehiculos.length,
          page:       1,
          limit:      100,
          totalPages: 1,
        },
      });
    } catch (err) { next(err); }
  });

  // GET /api/v1/mateodavid/vehiculos/booking/:id/disponibilidad
  router.get('/:id/disponibilidad', async (req, res, next) => {
    try {
      const vehiculo = await getVehiculo(req.params['id'] as string);

      if (!vehiculo) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Vehiculo no encontrado' },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          vehiculoId: vehiculo.id,
          disponible: vehiculo.disponible,
          status:     vehiculo.status,
          precioDia:  vehiculo.precioPorDia,
          agenciaId:  vehiculo.agenciaId,
          mensaje:    vehiculo.disponible
            ? 'El vehículo está disponible para alquiler'
            : `El vehículo no está disponible (estado: ${vehiculo.status})`,
        },
      });
    } catch (err) { next(err); }
  });

  // GET /api/v1/mateodavid/vehiculos/booking/:id
  router.get('/:id', async (req, res, next) => {
    try {
      const vehiculo = await getVehiculo(req.params['id'] as string);

      if (!vehiculo) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Vehiculo no encontrado' },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          ...vehiculo,
          precioDia: vehiculo.precioPorDia, // alias para compatibilidad
          agencia:   vehiculo.agenciaId,    // alias legacy
        },
      });
    } catch (err) { next(err); }
  });

  // PATCH /api/v1/mateodavid/vehiculos/booking/:id/status
  // Actualiza el estado del vehículo en el monolito (llamado por operaciones-service)
  router.patch('/:id/status', async (req, res, next) => {
    try {
      const { status } = req.body;
      const vehiculoId = req.params['id'] as string;

      if (!status) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'status es requerido' },
        });
        return;
      }

      const validStatuses = ['DISPONIBLE', 'RESERVADO', 'EN_USO', 'INACTIVO'] as const;
      const upperStatus   = status.toUpperCase();

      if (!validStatuses.includes(upperStatus as any)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: `status inválido. Valores: ${validStatuses.join(', ')}` },
        });
        return;
      }

      const result = await updateVehiculoStatus(
        vehiculoId,
        upperStatus as 'DISPONIBLE' | 'RESERVADO' | 'EN_USO' | 'INACTIVO',
      );

      res.json({
        success: true,
        data: { vehiculoId, status: upperStatus, estadoMonolith: result.estadoMonolith },
      });
    } catch (err) { next(err); }
  });

  // PATCH /api/v1/mateodavid/vehiculos/booking/:id/reservar (endpoint legacy)
  router.patch('/:id/reservar', async (_req, res) => {
    res.json({ success: true, message: 'Deprecated: use PATCH /:id/status instead.' });
  });

  // DELETE /api/v1/mateodavid/vehiculos/booking/cache (admin: invalidar caché)
  router.delete('/cache', (_req, res) => {
    clearMonolithCache();
    res.json({ success: true, message: 'Caché del monolito vaciada' });
  });

  return router;
}
