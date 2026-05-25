/**
 * src/api/vehiculos.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Llamadas HTTP al catálogo de vehículos.
 * Usa apiGateway → YARP en :5050 → catalogo-cluster en :5001
 */

import { apiGateway } from '../services/http.js';

const VEHICULOS_API = {
  /** Lista todos los vehículos disponibles */
  getAll(params = {}) {
    return apiGateway.get('/v1/vehiculos', { params }).then((r) => r.data);
  },

  /** Obtiene un vehículo por ID */
  getById(id) {
    return apiGateway.get(`/v1/vehiculos/${id}`).then((r) => r.data);
  },

  /** Crea un vehículo (admin) */
  create(payload) {
    return apiGateway.post('/v1/vehiculos', payload).then((r) => r.data);
  },

  /** Actualiza un vehículo (admin) */
  update(id, payload) {
    return apiGateway.put(`/v1/vehiculos/${id}`, payload).then((r) => r.data);
  },

  /** Elimina un vehículo (admin) */
  remove(id) {
    return apiGateway.delete(`/v1/vehiculos/${id}`).then((r) => r.data);
  },
};

export default VEHICULOS_API;
