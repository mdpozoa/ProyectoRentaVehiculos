import { Request, Response, NextFunction } from 'express';
import { AlquilerRepository } from './alquiler.repository.js';
import { NotFoundException, ValidationException } from '../../shared/errors/BusinessException.js';
import prisma from '../../shared/database/prisma.js';
import { updateVehiculoEstado } from '../../shared/grpc/inventario-grpc-client.js';

const INVENTARIO_URL = process.env['INVENTARIO_SERVICE_URL'] ?? 'http://localhost:3002';

async function patchVehiculoStatus(
  vehiculoId: string,
  status: string,
  usuarioId: string,
  motivo: string,
  kilometraje?: number,
  authHeader?: string
) {
  try {
    const grpcResult = await updateVehiculoEstado(vehiculoId, status, usuarioId, motivo);
    if (grpcResult?.success) {
      console.log(`[alquiler-controller] ✅ Vehículo ${vehiculoId} actualizado a ${status} vía gRPC`);
      return;
    }
  } catch (err: any) {
    console.warn(`[alquiler-controller] Falló actualización gRPC (usando fallback HTTP):`, err.message);
  }

  // Fallback REST HTTP
  const bodyData: any = { status };
  if (kilometraje !== undefined) bodyData.kilometraje = kilometraje;
  fetch(`${INVENTARIO_URL}/api/v1/mateodavid/vehiculos/${vehiculoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader ?? '' },
    body: JSON.stringify(bodyData),
  }).catch(() => {});
}

export class AlquilerController {
  constructor(private readonly alquilerRepository: AlquilerRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page   = Number(req.query.page)  || 1;
      const limit  = Number(req.query.limit) || 20;
      const status = req.query['status'] as string | undefined;
      res.json({ success: true, data: await this.alquilerRepository.findAll(page, limit, status) });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const alquiler = await this.alquilerRepository.findById(req.params['id'] as string);
      if (!alquiler) throw new NotFoundException('Alquiler', req.params['id'] as string);
      res.json({ success: true, data: alquiler });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reservaId, kmSalida, fechaInicio, observaciones } = req.body;

      const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
      if (!reserva) throw new NotFoundException('Reserva', reservaId);
      if (reserva.status !== 'CONFIRMADA') {
        throw new ValidationException('Solo se puede iniciar un alquiler de una reserva CONFIRMADA');
      }

      const existente = await this.alquilerRepository.findByReservaId(reservaId);
      if (existente) throw new ValidationException('Ya existe un alquiler para esta reserva');

      const alquiler = await prisma.$transaction(async (tx) => {
        const a = await tx.alquiler.create({
          data: {
            reservaId,
            kmSalida,
            fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
            observaciones,
            status: 'ACTIVO',
          },
        });
        await tx.reserva.update({ where: { id: reservaId }, data: { status: 'ACTIVA' } });
        return a;
      });

      if (reserva.vehiculoId) {
        patchVehiculoStatus(reserva.vehiculoId, 'EN_USO', req.user!.id, 'Inicio de alquiler', undefined, req.headers.authorization);
      }

      res.status(201).json({ success: true, data: await this.alquilerRepository.findById(alquiler.id) });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const alquiler = await this.alquilerRepository.findById(req.params['id'] as string);
      if (!alquiler) throw new NotFoundException('Alquiler', req.params['id'] as string);
      res.json({ success: true, data: await this.alquilerRepository.update(req.params['id'] as string, req.body) });
    } catch (err) { next(err); }
  };

  // Devolución anidada: PATCH /alquileres/:id/devolucion
  getDevolucion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const devolucion = await this.alquilerRepository.findDevolucion(req.params['id'] as string);
      if (!devolucion) throw new NotFoundException('Devolucion');
      res.json({ success: true, data: devolucion });
    } catch (err) { next(err); }
  };

  createDevolucion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const alquiler = await this.alquilerRepository.findById(req.params['id'] as string);
      if (!alquiler) throw new NotFoundException('Alquiler', req.params['id'] as string);
      if (alquiler.status !== 'ACTIVO') throw new ValidationException('El alquiler no está activo');

      const existente = await this.alquilerRepository.findDevolucion(req.params['id'] as string);
      if (existente) throw new ValidationException('Este alquiler ya tiene una devolución registrada');

      const { kmEntrada, estadoVehiculo, cargoExtra = 0, observaciones } = req.body;

      const reservaObj = await prisma.reserva.findUnique({ where: { id: alquiler.reservaId! } });

      const devolucion = await prisma.$transaction(async (tx) => {
        const d = await tx.devolucion.create({
          data: { alquilerId: req.params['id'] as string, kmEntrada, estadoVehiculo, cargoExtra, observaciones },
        });
        await tx.alquiler.update({
          where: { id: req.params['id'] as string },
          data:  { status: 'FINALIZADO', kmEntrada, fechaFin: new Date(), cargoAdicional: cargoExtra },
        });
        await tx.reserva.update({ where: { id: alquiler.reservaId! }, data: { status: 'COMPLETADA' } });
        return d;
      });

      if (reservaObj?.vehiculoId) {
        patchVehiculoStatus(reservaObj.vehiculoId, 'DISPONIBLE', req.user!.id, 'Fin de alquiler (devolución)', kmEntrada, req.headers.authorization);
      }

      res.status(201).json({ success: true, data: devolucion });
    } catch (err) { next(err); }
  };

  // Devolución plana para integración con Booking: POST /devoluciones
  createDevolucionFlat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { alquilerId, kmEntrada, estadoVehiculo, cargoExtra = 0, observaciones } = req.body;
      if (!alquilerId) throw new ValidationException('alquilerId es requerido');

      const alquiler = await this.alquilerRepository.findById(alquilerId);
      if (!alquiler) throw new NotFoundException('Alquiler', alquilerId);
      if (alquiler.status !== 'ACTIVO') throw new ValidationException('El alquiler no está activo');

      const existente = await this.alquilerRepository.findDevolucion(alquilerId);
      if (existente) throw new ValidationException('Este alquiler ya tiene una devolución registrada');

      const reservaObj = await prisma.reserva.findUnique({ where: { id: alquiler.reservaId! } });

      const devolucion = await prisma.$transaction(async (tx) => {
        const d = await tx.devolucion.create({
          data: { alquilerId, kmEntrada, estadoVehiculo, cargoExtra, observaciones },
        });
        await tx.alquiler.update({
          where: { id: alquilerId },
          data:  { status: 'FINALIZADO', kmEntrada, fechaFin: new Date(), cargoAdicional: cargoExtra },
        });
        await tx.reserva.update({ where: { id: alquiler.reservaId! }, data: { status: 'COMPLETADA' } });
        return d;
      });

      if (reservaObj?.vehiculoId) {
        patchVehiculoStatus(reservaObj.vehiculoId, 'DISPONIBLE', req.user?.id ?? 'SYSTEM', 'Fin de alquiler (devolución flat)', kmEntrada, req.headers.authorization);
      }

      res.status(201).json({ success: true, data: devolucion });
    } catch (err) { next(err); }
  };
}
