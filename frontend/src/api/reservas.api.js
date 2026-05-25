/**
 * src/api/reservas.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Llamadas HTTP a reservas, alquileres y devoluciones.
 * Usa apiGateway → YARP en :5050 → reservas-cluster en :5002
 */

import { apiGateway } from '@/services/http.js';

const RESERVAS_API = {
  /** Lista reservas (admin: todas; cliente: las propias filtradas por backend) */
  getAll(params = {}) {
    return apiGateway.get('/v1/reservas', { params }).then((r) => r.data);
  },

  /** Obtiene una reserva por ID */
  getById(id) {
    return apiGateway.get(`/v1/reservas/${id}`).then((r) => r.data);
  },

  /** Crea una nueva reserva */
  create(payload) {
    return apiGateway.post('/v1/reservas', payload).then((r) => r.data);
  },

  /** Cancela / actualiza una reserva */
  update(id, payload) {
    return apiGateway.put(`/v1/reservas/${id}`, payload).then((r) => r.data);
  },

  /** Lista alquileres activos */
  getAlquileres(params = {}) {
    return apiGateway.get('/v1/alquileres', { params }).then((r) => r.data);
  },

  /** Registra devolución de un alquiler */
  registrarDevolucion(alquilerId, payload) {
    return apiGateway
      .post(`/v1/devoluciones/${alquilerId}`, payload)
      .then((r) => r.data);
  },
};

export default RESERVAS_API;
