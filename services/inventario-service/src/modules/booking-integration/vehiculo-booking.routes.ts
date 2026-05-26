import { Router } from 'express';
import { VehiculoRepository } from '../vehiculos/vehiculo.repository.js';

const MONOLITH_URL = 'https://scintillating-warmth-production-d1f6.up.railway.app/api';
const FRONTEND_URL = 'https://nginx-frontend.ambitiousforest-4fd0ab3a.eastus.azurecontainerapps.io';

// Map vehicle color + year to image file
function resolveImageUrl(color: string, anio: number, placa: string): string {
  const c = (color || '').toLowerCase().trim();
  const y = anio;

  // Exact matches based on the image files available:
  // SparkAmarillo2018, SparkBlanco2017, SparkMorado2020, SparkNegro2025
  // SparkRojo2015, SparkRojo2018, SparkRojo2024, SparkVerde2016
  // SparkVerde2022, SparkVino2015

  let file: string | null = null;

  if (c.includes('amarillo')) file = 'SparkAmarillo2018.png';
  else if (c.includes('blanco')) file = 'SparkBlanco2017.png';
  else if (c.includes('morado')) file = 'SparkMorado2020.png';
  else if (c.includes('negro')) file = 'SparkNegro2025.png';
  else if (c.includes('vino') || c.includes('guinda') || c.includes('bordo')) file = 'SparkVino2015.png';
  else if (c.includes('rojo') || c.includes('red')) {
    if (y <= 2015) file = 'SparkRojo2015.png';
    else if (y <= 2018) file = 'SparkRojo2018.png';
    else file = 'SparkRojo2024.png';
  } else if (c.includes('verde') || c.includes('green')) {
    if (y <= 2016) file = 'SparkVerde2016.png';
    else file = 'SparkVerde2022.png';
  }

  if (!file) {
    // Fallback: pick by placa last digit
    const digits = placa.replace(/\D/g, '');
    const idx = digits.length > 0 ? parseInt(digits[digits.length - 1]!) % 10 : 0;
    const fallbacks = [
      'SparkRojo2018.png', 'SparkVerde2022.png', 'SparkNegro2025.png',
      'SparkBlanco2017.png', 'SparkAmarillo2018.png', 'SparkRojo2015.png',
      'SparkMorado2020.png', 'SparkVerde2016.png', 'SparkRojo2024.png', 'SparkVino2015.png'
    ];
    file = fallbacks[idx] ?? 'SparkRojo2018.png';
  }

  return `${FRONTEND_URL}/fotos_vehiculos/${file}`;
}

export function createVehiculoBookingRouter(repo: VehiculoRepository): Router {
  const router = Router();

  // Helper to fetch from Monolith with timeout
  const fetchMonolith = async (endpoint: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${MONOLITH_URL}${endpoint}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Error fetching ${endpoint} from monolith: ${res.status}`);
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  // GET /api/v1/mateodavid/vehiculos/booking
  router.get('/', async (req, res, next) => {
    try {
      const [vehiculos, modelos, categorias, marcas] = await Promise.all([
        fetchMonolith('/Vehiculos'),
        fetchMonolith('/Modelos'),
        fetchMonolith('/Categorias'),
        fetchMonolith('/Marcas')
      ]);

      const mapped = vehiculos.map((v: any) => {
        const modelo = modelos.find((m: any) => m.ID_Modelo === v.ID_Modelo);
        const marca = modelo ? marcas.find((ma: any) => ma.ID_Marca === modelo.ID_Marca) : null;
        const categoria = categorias.find((c: any) => c.ID_Categoria === v.ID_Categoria);
        const marcaNombre = marca ? marca.Nombre_Marca : '';
        const modeloNombre = modelo ? modelo.Nombre_Modelo : '';

        return {
          id:           v.ID_Vehiculo.toString(),
          nombre:       `${marcaNombre} ${modeloNombre} ${v.Anio_Vehiculo}`.trim(),
          descripcion:  `Color: ${v.Color_Vehiculo} | Combustible: ${v.Combustible_Vehiculo} | Placa: ${v.Placa_Vehiculo}`,
          precioPorDia: 45,
          moneda:       'USD',
          categoria:    categoria ? categoria.Nombre_Categoria : null,
          agenciaId:    v.ID_Agencia_Actual ? v.ID_Agencia_Actual.toString() : null,
          disponible:   v.Estado_Vehiculo === 'Disponible',
          status:       v.Estado_Vehiculo,
          // FIX: resolve actual image based on color and year
          imagenUrl:    resolveImageUrl(v.Color_Vehiculo, v.Anio_Vehiculo, v.Placa_Vehiculo),
        };
      });

      // Filter out non-available vehicles (Reservado, etc.)
      let finalData = mapped.filter((v: any) => v.disponible);
      const statusQuery = req.query['status'] as string | undefined;
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
          precioDia: 45,
          agenciaId: vehiculo.ID_Agencia_Actual ? vehiculo.ID_Agencia_Actual.toString() : null,
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
      const vehiculos = await fetchMonolith('/Vehiculos');
      const v = vehiculos.find((veh: any) => veh.ID_Vehiculo.toString() === req.params['id']);

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
        // FIX: resolve actual image based on color and year
        imagenUrl:    resolveImageUrl(v.Color_Vehiculo, v.Anio_Vehiculo, v.Placa_Vehiculo),
        precioDia:    45,
        agencia:      v.ID_Agencia_Actual ? v.ID_Agencia_Actual.toString() : null,
      };

      res.json({ success: true, data: dto });
    } catch (err) { next(err); }
  });

  // PATCH /api/v1/mateodavid/vehiculos/booking/:id/status
  // FIX: this is the endpoint called by operaciones-service to update vehicle status
  router.patch('/:id/status', async (req, res, next) => {
    try {
      const { status } = req.body;
      const vehiculoId = req.params['id'];

      if (!status) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'status es requerido' } });
        return;
      }

      // Map inventario-service status to monolith Estado_Vehiculo
      const statusMap: Record<string, string> = {
        'DISPONIBLE': 'Disponible',
        'RESERVADO':  'Reservado',
        'EN_USO':     'Reservado', // monolith doesn't have EN_USO, closest is Reservado
        'INACTIVO':   'Reservado',
      };

      const estadoMonolith = statusMap[status.toUpperCase()] ?? 'Disponible';

      // Update in Monolith via Supabase REST API directly
      const supabaseUrl = 'https://mzgggdprufdvpzybpctv.supabase.co';
      const supabaseKey = process.env['SUPABASE_KEY'] ?? 'sb_publishable_4R9XAvZLQjxzwgKqUT8jtg_8EG30Pgj';

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/vehiculo?id_vehiculo=eq.${vehiculoId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey':       supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer':       'return=minimal',
          },
          body: JSON.stringify({ estado_vehiculo: estadoMonolith }),
        }
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error(`Error updating vehicle ${vehiculoId} status in Supabase:`, errText);
        // Still return success to not crash the booking flow
        res.json({ success: true, message: 'Status sync attempted', status });
        return;
      }

      res.json({ success: true, data: { vehiculoId, status, estadoMonolith } });
    } catch (err) { next(err); }
  });

  // PATCH /api/v1/mateodavid/vehiculos/booking/:id/reservar (legacy)
  router.patch('/:id/reservar', async (req, res) => {
    res.json({ success: true, message: 'Use /status endpoint instead.' });
  });

  return router;
}
