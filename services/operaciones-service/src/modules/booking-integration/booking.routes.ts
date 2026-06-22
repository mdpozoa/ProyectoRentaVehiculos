import { Router, Request, Response, NextFunction } from 'express';
import { ReservaRepository }  from '../reservas/reserva.repository.js';
import { AlquilerRepository } from '../alquileres/alquiler.repository.js';
import prisma from '../../shared/database/prisma.js';

// ── URLs de servicios externos ────────────────────────────────────────────────
// Para actualizar el estado del vehículo vamos directo a Supabase REST,
// así NO dependemos del inventario-service (que en Railway no es localhost:3002).
// IMPORTANTE: estas variables se configuran en el archivo .env
const SUPABASE_MONOLITH_URL = process.env['SUPABASE_MONOLITH_URL'] ?? 'https://mzgggdprufdvpzybpctv.supabase.co';
const SUPABASE_MONOLITH_KEY = process.env['SUPABASE_MONOLITH_KEY'] ?? '';

// ── UUID helpers ──────────────────────────────────────────────────────────────
// Prisma exige UUIDs válidos. El sistema de booking puede mandar "16" o "GUEST".
// toSafeUuid convierte cualquier string a UUID válido de forma determinista.
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

// ── Actualizar estado vehículo en Supabase (fire-and-forget) ─────────────────
// Va directo a Supabase REST, sin pasar por inventario-service.
// Si falla, no rompe el flujo de la reserva.
function syncVehiculoStatus(vehiculoIdRaw: string | number, nuevoEstado: 'Disponible' | 'Reservado'): void {
  const idNum = Number(vehiculoIdRaw);
  if (!Number.isFinite(idNum)) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6_000);

  fetch(`${SUPABASE_MONOLITH_URL}/rest/v1/vehiculo?id_vehiculo=eq.${idNum}`, {
    method: 'PATCH',
    headers: {
      'apikey':        SUPABASE_MONOLITH_KEY,
      'Authorization': `Bearer ${SUPABASE_MONOLITH_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify({ estado_vehiculo: nuevoEstado }),
    signal: controller.signal,
  })
    .then(r => console.log(`[syncVehiculo] ${vehiculoIdRaw} → ${nuevoEstado}: HTTP ${r.status}`))
    .catch(err => console.error(`[syncVehiculo] Error (ignorado):`, err?.message ?? err))
    .finally(() => clearTimeout(timer));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function toReservaBookingDto(reserva: any) {
  return {
    id:            reserva.id,
    codigoReserva: reserva.codigoReserva,
    vehiculoId:    reserva.vehiculoId,
    clienteId:     reserva.usuarioId,
    agenciaId:     reserva.agenciaId,
    fechaInicio:   reserva.fechaInicio,
    fechaFin:      reserva.fechaFin,
    diasTotal:     reserva.diasTotal,
    totalAmount:   Number(reserva.totalAmount),
    status:        reserva.status,
    notas:         reserva.notas,
  };
}

// ── State machine ─────────────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  PENDIENTE:  ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['ACTIVA',     'CANCELADA'],
  ACTIVA:     ['COMPLETADA', 'CANCELADA'],
  COMPLETADA: [],
  CANCELADA:  [],
} as const;

const VALID_STATUSES = Object.keys(ALLOWED_TRANSITIONS);

// ── SSE Clients ───────────────────────────────────────────────────────────────
const sseClients: Response[] = [];

// ── /reservas/booking ─────────────────────────────────────────────────────────
export function createReservaBookingRouter(reservaRepo: ReservaRepository): Router {
  const router = Router();

  // GET /api/v1/mateodavid/reservas/booking/stream (SSE)
  router.get('/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    sseClients.push(res);
    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // GET /api/v1/mateodavid/reservas/booking/:id
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    if (req.params['id'] === 'stream') return next();
    try {
      const reserva = await reservaRepo.findById(req.params['id'] as string);
      if (!reserva) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Reserva ${req.params['id']} no encontrada` } });
        return;
      }
      res.json({ success: true, data: toReservaBookingDto(reserva) });
    } catch (err) { next(err); }
  });

  // POST /api/v1/mateodavid/reservas/booking
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        vehiculoId,
        clienteId,
        agenciaId: bodyAgenciaId,
        fechaInicio,
        fechaFin,
        clienteNombre,
        clienteEmail,
        precioDia: bodyPrecioDia,
        totalAmount: bodyTotalAmount,
      } = req.body;

      // ── 1. Validación mínima de campos obligatorios ──
      if (!vehiculoId || !fechaInicio || !fechaFin) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'vehiculoId, fechaInicio y fechaFin son requeridos' },
        });
        return;
      }

      // ── 2. Calcular días (sin rechazar por fechas pasadas — el booking externo manda lo que manda) ──
      const dias = calcDias(String(fechaInicio), String(fechaFin));

      // ── 3. Precio (usa el que manda el booking, o 45 por defecto) ──
      const precioDia   = Number(bodyPrecioDia) > 0 ? Number(bodyPrecioDia) : 45;
      const totalAmount = Number(bodyTotalAmount) > 0 ? Number(bodyTotalAmount) : precioDia * dias;

      // ── 4. Strings seguros para Prisma (convierte "16" → UUID válido) ──
      const safeVehiculoId = toSafeUuid(vehiculoId);
      const safeAgenciaId  = toSafeUuid(bodyAgenciaId ?? '1');
      const safeUsuarioId  = toSafeUuid(clienteId);

      // Fechas como string "YYYY-MM-DD"
      const fechaInicioStr = String(fechaInicio).split('T')[0]!;
      const fechaFinStr    = String(fechaFin).split('T')[0]!;

      // Notas con info del cliente (si viene del booking)
      let notas: string | undefined;
      if (clienteNombre || clienteEmail) {
        notas = `Cliente: ${clienteNombre ?? 'N/A'} (${clienteEmail ?? 'N/A'})`;
      }

      // ── 5. Crear reserva en BD ──
      const reserva = await reservaRepo.create({
        usuarioId:     safeUsuarioId,
        vehiculoId:    safeVehiculoId,
        agenciaId:     safeAgenciaId,
        fechaInicio:   fechaInicioStr,
        fechaFin:      fechaFinStr,
        diasTotal:     dias,
        precioBase:    totalAmount,
        precioExtras:  0,
        precioSeguro:  0,
        totalAmount,
        codigoReserva: generarCodigo(),
        notas,
      });

      // ── 6. Confirmar reserva inmediatamente ──
      const reservaConfirmada = await reservaRepo.update(reserva.id, { status: 'CONFIRMADA' });

      // ── 7. Actualizar vehículo a "Reservado" en Supabase (fire-and-forget, NO bloquea) ──
      syncVehiculoStatus(vehiculoId, 'Reservado');

      // ── 8. Notificar SSE ──
      const ssePayload = JSON.stringify({ vehiculoId, status: 'RESERVADO' });
      sseClients.forEach(client => { client.write(`data: ${ssePayload}\n\n`); });

      res.status(201).json({ success: true, data: toReservaBookingDto(reservaConfirmada) });

    } catch (err: any) {
      // Capturamos errores de Prisma y los devolvemos como 400 (no 500) para que el booking los entienda
      console.error('[POST /reservas/booking] Error:', err?.message ?? err);
      if (err?.code === 'P2002') {
        // Unique constraint — reserva duplicada
        res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Ya existe una reserva para este vehículo' } });
        return;
      }
      next(err);
    }
  });

  // PATCH /api/v1/mateodavid/reservas/booking/:id
  router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nuevoStatus: unknown = req.body.status;

      if (typeof nuevoStatus !== 'string' || !VALID_STATUSES.includes(nuevoStatus)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: `status inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}` },
        });
        return;
      }

      const reserva = await reservaRepo.findById(req.params['id'] as string);
      if (!reserva) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Reserva ${req.params['id']} no encontrada` } });
        return;
      }

      const currentStatus = reserva.status as string;

      // Idempotencia: si ya está en ese estado, responder OK
      if (currentStatus === nuevoStatus) {
        res.json({ success: true, data: toReservaBookingDto(reserva) });
        return;
      }

      const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(nuevoStatus)) {
        res.status(422).json({
          success: false,
          error: { code: 'INVALID_TRANSITION', message: `No se puede cambiar de ${currentStatus} a ${nuevoStatus}` },
        });
        return;
      }

      const updated = await reservaRepo.update(req.params['id'] as string, { status: nuevoStatus });

      // Sincronizar estado del vehículo (fire-and-forget)
      if (reserva.vehiculoId) {
        // Intentamos extraer el ID original numérico de las notas o usamos el vehiculoId del reserva
        const vehiculoIdOriginal = reserva.vehiculoId;
        if (nuevoStatus === 'CANCELADA') {
          syncVehiculoStatus(vehiculoIdOriginal, 'Disponible');
        } else if (nuevoStatus === 'CONFIRMADA') {
          syncVehiculoStatus(vehiculoIdOriginal, 'Reservado');
        }
      }

      res.json({ success: true, data: toReservaBookingDto(updated) });
    } catch (err) { next(err); }
  });

  return router;
}

// ── /alquileres/booking ───────────────────────────────────────────────────────
export function createAlquilerBookingRouter(alquilerRepo: AlquilerRepository): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reservaId, kmSalida, fechaInicio, observaciones } = req.body;

      if (!reservaId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'reservaId es requerido' } });
        return;
      }

      const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
      if (!reserva) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Reserva ${reservaId} no encontrada` } });
        return;
      }
      if (reserva.status !== 'CONFIRMADA') {
        res.status(422).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Solo se puede iniciar un alquiler de una reserva CONFIRMADA' } });
        return;
      }

      const existente = await alquilerRepo.findByReservaId(reservaId);
      if (existente) {
        res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Ya existe un alquiler para esta reserva' } });
        return;
      }

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

      const result = await alquilerRepo.findById(alquiler.id);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  });

  return router;
}

// ── /devoluciones/booking ─────────────────────────────────────────────────────
export function createDevolucionBookingRouter(alquilerRepo: AlquilerRepository): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { alquilerId, kmEntrada, estadoVehiculo, cargoExtra = 0, observaciones } = req.body;

      if (!alquilerId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'alquilerId es requerido' } });
        return;
      }

      const alquiler = await alquilerRepo.findById(alquilerId);
      if (!alquiler) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Alquiler ${alquilerId} no encontrado` } });
        return;
      }
      if (alquiler.status !== 'ACTIVO') {
        res.status(422).json({ success: false, error: { code: 'INVALID_STATUS', message: 'El alquiler no está activo' } });
        return;
      }

      const existente = await alquilerRepo.findDevolucion(alquilerId);
      if (existente) {
        res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Este alquiler ya tiene una devolución registrada' } });
        return;
      }

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
        syncVehiculoStatus(reservaObj.vehiculoId, 'Disponible');
      }

      res.status(201).json({ success: true, data: devolucion });
    } catch (err) { next(err); }
  });

  return router;
}
