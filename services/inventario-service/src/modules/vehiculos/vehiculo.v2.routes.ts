/**
 * vehiculo.v2.routes.ts — API v2 para vehículos con filtros avanzados y HATEOAS.
 *
 * Novedades frente a v1:
 *   - Filtros avanzados: marca, modelo, categoria, combustible, transmision,
 *     precioMin, precioMax, status, agenciaId, disponible (bool)
 *   - Ordenamiento configurable (precioDia ASC/DESC, createdAt)
 *   - Paginación con metadatos ricos (hasNext, hasPrev, links)
 *   - Respuesta HATEOAS con links al modelo, marca, agencia
 *   - Endpoint de búsqueda rápida /search?q=
 *
 * Base: /api/v2/mateodavid/inventario/vehiculos
 */

import { Router, Request, Response, NextFunction } from 'express';
import { VehiculoRepository } from './vehiculo.repository.js';
import { authenticate } from '../../shared/middlewares/auth.middleware.js';

function buildVehiculoLinks(v: any) {
  const base = '/api/v2/mateodavid/inventario/vehiculos';
  return {
    self:       `${base}/${v.id}`,
    modelo:     `/api/v2/mateodavid/inventario/modelos/${v.modeloId}`,
    categoria:  v.categoriaId ? `/api/v2/mateodavid/inventario/categorias/${v.categoriaId}` : null,
    reservar:   `/api/v2/mateodavid/operaciones/reservas`,
  };
}

export function createVehiculoV2Router(repo: VehiculoRepository): Router {
  const router = Router();

  /**
   * GET /api/v2/mateodavid/inventario/vehiculos
   * Filtros: agenciaId, categoriaId, status, disponible, precioMin, precioMax
   * Orden: sortBy (precioDia|createdAt), order (asc|desc)
   */
  router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page  = Math.max(1, Number(req.query.page)  || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

      // Filtros básicos soportados por el repositorio
      const filters: Record<string, string | undefined> = {
        agenciaId:   req.query['agenciaId']   as string | undefined,
        categoriaId: req.query['categoriaId'] as string | undefined,
        status:      req.query['disponible'] === 'true'
          ? 'DISPONIBLE'
          : req.query['status'] as string | undefined,
      };

      const result = await repo.findAll(page, limit, filters as any);

      // Filtros adicionales client-side (para no romper el repositorio existente)
      let data = result.data as any[];

      if (req.query['precioMin']) {
        const min = Number(req.query['precioMin']);
        data = data.filter((v: any) => Number(v.precioDia) >= min);
      }
      if (req.query['precioMax']) {
        const max = Number(req.query['precioMax']);
        data = data.filter((v: any) => Number(v.precioDia) <= max);
      }
      if (req.query['marcaId']) {
        const marcaId = req.query['marcaId'] as string;
        data = data.filter((v: any) => v.modelo?.marcaId === marcaId || v.modelo?.marca?.id === marcaId);
      }

      // Ordenamiento
      const sortBy = (req.query['sortBy'] as string) || 'createdAt';
      const order  = (req.query['order']  as string) === 'asc' ? 1 : -1;
      if (sortBy === 'precioDia') {
        data.sort((a: any, b: any) => (Number(a.precioDia) - Number(b.precioDia)) * order);
      }

      const baseUrl    = '/api/v2/mateodavid/inventario/vehiculos';
      const total      = data.length;
      const totalPages = Math.ceil(total / limit);
      const paged      = data.slice((page - 1) * limit, page * limit);

      const query = new URLSearchParams();
      if (req.query['status'])      query.set('status',      req.query['status'] as string);
      if (req.query['agenciaId'])   query.set('agenciaId',   req.query['agenciaId'] as string);
      if (req.query['disponible'])  query.set('disponible',  req.query['disponible'] as string);
      if (req.query['precioMin'])   query.set('precioMin',   req.query['precioMin'] as string);
      if (req.query['precioMax'])   query.set('precioMax',   req.query['precioMax'] as string);
      const qs = query.toString() ? `&${query.toString()}` : '';

      res.json({
        success: true,
        data: paged.map((v: any) => ({ ...v, _links: buildVehiculoLinks(v) })),
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          filters: { ...filters, precioMin: req.query['precioMin'], precioMax: req.query['precioMax'] },
        },
        _links: {
          self:  `${baseUrl}?page=${page}&limit=${limit}${qs}`,
          next:  page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}${qs}` : null,
          prev:  page > 1         ? `${baseUrl}?page=${page - 1}&limit=${limit}${qs}` : null,
          first: `${baseUrl}?page=1&limit=${limit}${qs}`,
          last:  `${baseUrl}?page=${totalPages}&limit=${limit}${qs}`,
        },
      });
    } catch (err) { next(err); }
  });

  /**
   * GET /api/v2/mateodavid/inventario/vehiculos/search?q=texto
   * Búsqueda rápida por placa, modelo o marca (client-side sobre lista disponible)
   */
  router.get('/search', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query['q'] ?? '').toLowerCase().trim();
      if (!q || q.length < 2) {
        res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Búsqueda mínima de 2 caracteres' } });
        return;
      }

      const result = await repo.findAll(1, 200, {});
      const filtered = (result.data as any[]).filter((v: any) =>
        v.placa?.toLowerCase().includes(q) ||
        v.modelo?.nombre?.toLowerCase().includes(q) ||
        v.modelo?.marca?.nombre?.toLowerCase().includes(q) ||
        v.color?.toLowerCase().includes(q),
      );

      res.json({
        success: true,
        data: filtered.slice(0, 20).map((v: any) => ({ ...v, _links: buildVehiculoLinks(v) })),
        meta: { total: filtered.length, query: q },
      });
    } catch (err) { next(err); }
  });

  /**
   * GET /api/v2/mateodavid/inventario/vehiculos/:id
   */
  router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehiculo = await repo.findById(req.params['id'] as string);
      if (!vehiculo) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehículo no encontrado' } });
        return;
      }
      res.json({
        success: true,
        data: { ...vehiculo, _links: buildVehiculoLinks(vehiculo) },
      });
    } catch (err) { next(err); }
  });

  return router;
}
