import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createVehiculoRouter }        from './modules/vehiculos/vehiculo.routes.js';
import { createVehiculoV2Router }      from './modules/vehiculos/vehiculo.v2.routes.js';
import { createMarcaRouter }           from './modules/marcas/marca.routes.js';
import { createModeloRouter }          from './modules/modelos/modelo.routes.js';
import { createCategoriaRouter }       from './modules/categorias/categoria.routes.js';
import { createTipoCombustibleRouter } from './modules/tipos-combustible/tipo-combustible.routes.js';
import { createTipoTransmisionRouter } from './modules/tipos-transmision/tipo-transmision.routes.js';
import { createExtraRouter }           from './modules/extras/extra.routes.js';
import {
  vehiculoRepository,
  vehiculoController,
  marcaController,
  modeloController,
  categoriaController,
  tipoCombustibleController,
  tipoTransmisionController,
  extraController,
} from './shared/container.js';
import { createVehiculoBookingRouter } from './modules/booking-integration/vehiculo-booking.routes.js';
import { errorHandler } from './shared/errors/error.middleware.js';
import { swaggerSpec } from './shared/swagger.js';

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ service: 'inventario-service', status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/v1/mateodavid/estados-vehiculo', (_req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'DISPONIBLE',    nombre: 'Disponible' },
      { id: 'EN_USO',        nombre: 'En uso' },
      { id: 'MANTENIMIENTO', nombre: 'Mantenimiento' },
      { id: 'RESERVADO',     nombre: 'Reservado' },
      { id: 'INACTIVO',      nombre: 'Inactivo' },
    ],
  });
});

app.use('/api/v1/mateodavid/vehiculos/booking', createVehiculoBookingRouter(vehiculoRepository));
app.use('/api/v1/mateodavid/vehiculos',         createVehiculoRouter(vehiculoController));
app.use('/api/v1/mateodavid/marcas',            createMarcaRouter(marcaController));
app.use('/api/v1/mateodavid/modelos',           createModeloRouter(modeloController));
app.use('/api/v1/mateodavid/categorias',        createCategoriaRouter(categoriaController));
app.use('/api/v1/mateodavid/tipos-combustible', createTipoCombustibleRouter(tipoCombustibleController));
app.use('/api/v1/mateodavid/tipos-transmision', createTipoTransmisionRouter(tipoTransmisionController));
app.use('/api/v1/mateodavid/extras',            createExtraRouter(extraController));

// ── API v2 — Rutas versionadas con filtros avanzados y HATEOAS ────────────────
// search debe ir ANTES de /:id para que no sea capturado como ID
app.use('/api/v2/mateodavid/inventario/vehiculos', createVehiculoV2Router(vehiculoRepository));

app.use(errorHandler);

export default app;
