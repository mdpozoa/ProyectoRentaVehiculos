import { Request, Response, NextFunction } from 'express';
import { VehiculoRepository } from './vehiculo.repository.js';
import { NotFoundException }  from '../../shared/errors/BusinessException.js';

// ── Mapper: DB record → Booking contract shape ───────────────────────────────
function toBookingDto(v: any) {
  const marcaNombre  = v.modelo?.marca?.nombre  ?? '';
  const modeloNombre = v.modelo?.nombre         ?? '';
  const catNombre    = typeof v.categoria === 'object' ? (v.categoria?.nombre ?? null) : (v.categoria ?? null);
  return {
    id:           v.id,
    nombre:       `${marcaNombre} ${modeloNombre} ${v.anio}`.trim(),
    descripcion:  v.descripcion ?? `Color: ${v.color ?? ''} | Placa: ${v.placa ?? ''}`,
    precioPorDia: Number(v.precioDia ?? v.precioPorDia ?? 0),
    moneda:       'USD',
    categoria:    catNombre,
    agenciaId:    v.agenciaId ?? null,
    disponible:   v.status === 'DISPONIBLE' && v.isActive !== false,
    status:       v.status,
    imagenUrl:    v.imagenUrl ?? null,
  };
}

export class VehiculoController {
  constructor(private readonly vehiculoRepository: VehiculoRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page   = Number(req.query.page)  || 1;
      const limit  = Number(req.query.limit) || 20;
      const disponibleFilter = req.query['disponible'] === 'true';
      const filters = {
        agenciaId:   req.query['agenciaId']   as string | undefined,
        categoriaId: req.query['categoriaId'] as string | undefined,
        status:      disponibleFilter ? 'DISPONIBLE' : (req.query['status'] as string | undefined),
      };
      const result = await this.vehiculoRepository.findAll(page, limit, filters);
      // Respond in Booking-contract-compliant format
      res.json({
        success: true,
        data: {
          data:       (result.data as any[]).map(toBookingDto),
          total:      result.total,
          page:       result.page,
          limit:      result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) { next(err); }
  };

  marketplace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        agenciaId:   req.query['agenciaId']   as string | undefined,
        categoriaId: req.query['categoriaId'] as string | undefined,
        status:      'DISPONIBLE',
      };
      const result = await this.vehiculoRepository.findAll(1, 200, filters);
      res.json({ success: true, data: result.data.map(toBookingDto) });
    } catch (err) { next(err); }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        agenciaId:   req.query['agenciaId']   as string | undefined,
        categoriaId: req.query['categoriaId'] as string | undefined,
        status:      'DISPONIBLE',
      };
      const result = await this.vehiculoRepository.findAll(1, 200, filters);
      res.json({ success: true, data: result.data.map(toBookingDto) });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehiculo = await this.vehiculoRepository.findById(req.params['id'] as string);
      if (!vehiculo) throw new NotFoundException('Vehiculo', req.params['id'] as string);
      res.json({ success: true, data: toBookingDto(vehiculo) });
    } catch (err) { next(err); }
  };

  checkDisponibilidad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehiculo = await this.vehiculoRepository.findById(req.params['id'] as string);
      if (!vehiculo) throw new NotFoundException('Vehiculo', req.params['id'] as string);
      const disponible = vehiculo.status === 'DISPONIBLE' && vehiculo.isActive;
      res.json({
        success: true,
        data: {
          vehiculoId: vehiculo.id,
          disponible,
          status:     vehiculo.status,
          mensaje:    disponible
            ? 'El vehiculo esta disponible para las fechas solicitadas.'
            : `El vehículo no está disponible (estado: ${vehiculo.status})`,
        },
      });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({ success: true, data: await this.vehiculoRepository.create(req.body) });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: await this.vehiculoRepository.update(req.params['id'] as string, req.body) });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.vehiculoRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deactivated: true } });
    } catch (err) { next(err); }
  };
}
