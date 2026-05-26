import { Router } from 'express';
import { VehiculoRepository } from '../vehiculos/vehiculo.repository.js';

const MONOLITH_URL = 'https://scintillating-warmth-production-d1f6.up.railway.app/api';

export function createVehiculoBookingRouter(repo: VehiculoRepository): Router {
  const router = Router();

  // Helper to fetch from Monolith
  const fetchMonolith = async (endpoint: string) => {
    const res = await fetch(`${MONOLITH_URL}${endpoint}`);
    if (!res.ok) throw new Error(`Error fetching ${endpoint} from monolith`);
    return res.json();
  };

  // GET /api/v1/mateodavid/vehiculos/booking
  router.get('/', async (req, res, next) => {
    try {
      // 1. Fetch real-time data from Monolith
      const [vehiculos, modelos, categorias, marcas] = await Promise.all([
        fetchMonolith('/Vehiculos'),
        fetchMonolith('/Modelos'),
        fetchMonolith('/Categorias'),
        fetchMonolith('/Marcas')
      ]);

      // 2. Map data to the Booking DTO
      const mapped = vehiculos.map((v: any) => {
        const modelo = modelos.find((m: any) => m.ID_Modelo === v.ID_Modelo);
        const marca = modelo ? marcas.find((ma: any) => ma.ID_Marca === modelo.ID_Marca) : null;
        const categoria = categorias.find((c: any) => c.ID_Categoria === v.ID_Categoria);

        const marcaNombre = marca ? marca.Nombre_Marca : '';
        const modeloNombre = modelo ? modelo.Nombre_Modelo : '';
        
        return {
          id:           v.ID_Vehiculo.toString(), // Convert ID to string for compatibility if needed
          nombre:       `${marcaNombre} ${modeloNombre} ${v.Anio_Vehiculo}`.trim(),
          descripcion:  `Color: ${v.Color_Vehiculo} | Combustible: ${v.Combustible_Vehiculo} | Placa: ${v.Placa_Vehiculo}`,
          precioPorDia: 45, // default since Monolith might not have it
          moneda:       'USD',
          categoria:    categoria ? categoria.Nombre_Categoria : null,
          agenciaId:    v.ID_Agencia_Actual ? v.ID_Agencia_Actual.toString() : null,
          disponible:   v.Estado_Vehiculo === 'Disponible',
          status:       v.Estado_Vehiculo,
          imagenUrl:    null,
        };
      });

      // Filter by status if provided
      let finalData = mapped;
      const statusQuery = req.query['status'] as string | undefined;
      // Default to returning everything so the frontend handles it, or filter if explicitly requested.
      // The frontend Vehiculos.vue doesn't pass ?status= parameter, it relies on returning everything.
      if (statusQuery) {
         finalData = mapped.filter((v: any) => v.status.toUpperCase() === statusQuery.toUpperCase());
      }

      res.json({ success: true, data: { data: finalData, total: finalData.length, page: 1, limit: 100, totalPages: 1 } });
    } catch (err) { next(err); }
  });

  // GET /api/v1/mateodavid/vehiculos/booking/:id/disponibilidad
  router.get('/:id/disponibilidad', async (req, res, next) => {
    try {
      const vehiculos = await fetchMonolith('/Vehiculos');
      const vehiculo = vehiculos.find((v: any) => v.ID_Vehiculo.toString() === req.params['id']);
      
      if (!vehiculo) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Vehiculo no encontrado` } });
        return;
      }
      
      const disponible = vehiculo.Estado_Vehiculo === 'Disponible';
      res.json({
        success: true,
        data: {
          vehiculoId: vehiculo.ID_Vehiculo.toString(),
          disponible,
          status:  vehiculo.Estado_Vehiculo,
          mensaje: disponible
            ? 'El vehículo está disponible para alquiler'
            : `El vehículo no está disponible (estado: ${vehiculo.Estado_Vehiculo})`,
        },
      });
    } catch (err) { next(err); }
  });

  // GET /api/v1/mateodavid/vehiculos/booking/:id
  router.get('/:id', async (req, res, next) => {
    try {
      const v = await fetchMonolith(`/Vehiculos/${req.params['id']}`);
      if (!v) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Vehiculo no encontrado` } });
        return;
      }
      
      const [modelos, categorias, marcas] = await Promise.all([
        fetchMonolith('/Modelos'),
        fetchMonolith('/Categorias'),
        fetchMonolith('/Marcas')
      ]);

      const modelo = modelos.find((m: any) => m.ID_Modelo === v.ID_Modelo);
      const marca = modelo ? marcas.find((ma: any) => ma.ID_Marca === modelo.ID_Marca) : null;
      const categoria = categorias.find((c: any) => c.ID_Categoria === v.ID_Categoria);

      const dto = {
          id:           v.ID_Vehiculo.toString(),
          nombre:       `${marca ? marca.Nombre_Marca : ''} ${modelo ? modelo.Nombre_Modelo : ''} ${v.Anio_Vehiculo}`.trim(),
          descripcion:  `Color: ${v.Color_Vehiculo} | Combustible: ${v.Combustible_Vehiculo} | Placa: ${v.Placa_Vehiculo}`,
          precioPorDia: 45,
          moneda:       'USD',
          categoria:    categoria ? categoria.Nombre_Categoria : null,
          agenciaId:    v.ID_Agencia_Actual ? v.ID_Agencia_Actual.toString() : null,
          disponible:   v.Estado_Vehiculo === 'Disponible',
          status:       v.Estado_Vehiculo,
          imagenUrl:    null,
      };
      
      res.json({ success: true, data: dto });
    } catch (err) { next(err); }
  });

  // PATCH /api/v1/mateodavid/vehiculos/booking/:id/reservar
  router.patch('/:id/reservar', async (req, res, next) => {
    // This is no longer strictly needed if the C# Monolith handles reservations directly,
    // but we can return a success just to not break any existing contracts.
    res.json({ success: true, message: "Use the Monolith C# API directly for creating reservations." });
  });

  return router;
}
