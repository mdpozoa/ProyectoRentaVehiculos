/**
 * src/api/booking.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de API para el operaciones-service (Booking).
 * Puerto: 3004
 * Base: http://localhost:3004/api/v1/mateodavid
 *
 * Endpoints cubiertos:
 *  ✅ GET    /health
 *  ✅ POST   /reservas/booking       → crear reserva
 *  ✅ GET    /reservas/booking/:id   → obtener reserva
 *  ✅ PATCH  /reservas/booking/:id   → cambiar estado reserva
 *  ✅ POST   /alquileres/booking     → iniciar alquiler (entrega vehículo)
 *  ✅ POST   /devoluciones/booking   → registrar devolución
 */

import axios from 'axios';

// Instancia dedicada al operaciones-service
const operacionesHttp = axios.create({
  baseURL: `${import.meta.env.VITE_API_OPERACIONES ?? 'http://localhost:3004'}/api/v1/mateodavid`,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar JWT automáticamente
operacionesHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const unwrap = (res) => res.data?.data ?? res.data;

// ── Booking API ───────────────────────────────────────────────────────────────
const BOOKING_API = {

  // ── Health ────────────────────────────────────────────────────────────────
  /** GET /health — verifica que el servicio esté levantado */
  health: () =>
    axios.get(`${import.meta.env.VITE_API_OPERACIONES ?? 'http://localhost:3004'}/health`)
      .then(r => r.data),

  // ── Reservas ──────────────────────────────────────────────────────────────
  /**
   * Crear una reserva nueva.
   * @param {{ vehiculoId, clienteId, agenciaId?, fechaInicio, fechaFin }} payload
   */
  crearReserva: (payload) =>
    operacionesHttp.post('/reservas/booking', payload).then(unwrap),

  /** Obtener una reserva por ID (UUID) */
  getReserva: (id) =>
    operacionesHttp.get(`/reservas/booking/${id}`).then(unwrap),

  /**
   * Cambiar el estado de una reserva.
   * Transiciones válidas:
   *   PENDIENTE  → CONFIRMADA | CANCELADA
   *   CONFIRMADA → ACTIVA     | CANCELADA
   *   ACTIVA     → COMPLETADA | CANCELADA
   * @param {string} id
   * @param {'CONFIRMADA'|'ACTIVA'|'COMPLETADA'|'CANCELADA'} status
   */
  cambiarEstadoReserva: (id, status) =>
    operacionesHttp.patch(`/reservas/booking/${id}`, { status }).then(unwrap),

  // ── Alquileres (entrega del vehículo) ─────────────────────────────────────
  /**
   * Inicia el alquiler una vez la reserva está CONFIRMADA.
   * La reserva pasa a ACTIVA y el vehículo a EN_USO.
   * @param {{ reservaId, kmSalida, fechaInicio?, observaciones? }} payload
   */
  iniciarAlquiler: (payload) =>
    operacionesHttp.post('/alquileres/booking', payload).then(unwrap),

  // ── Devoluciones ──────────────────────────────────────────────────────────
  /**
   * Registra la devolución del vehículo.
   * El alquiler pasa a FINALIZADO, la reserva a COMPLETADA.
   * @param {{ alquilerId, kmEntrada, estadoVehiculo, cargoExtra?, observaciones? }} payload
   */
  registrarDevolucion: (payload) =>
    operacionesHttp.post('/devoluciones/booking', payload).then(unwrap),
};

export default BOOKING_API;
