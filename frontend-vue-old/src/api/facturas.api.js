/**
 * src/api/facturas.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Llamadas HTTP a facturación y pagos.
 * Usa apiGateway → YARP en :5050 → facturacion-cluster en :5003
 */

import { apiGateway } from '../services/http.js';

const FACTURAS_API = {
  getAll(params = {}) {
    return apiGateway.get('/v1/facturas', { params }).then((r) => r.data);
  },

  getById(id) {
    return apiGateway.get(`/v1/facturas/${id}`).then((r) => r.data);
  },

  create(payload) {
    return apiGateway.post('/v1/facturas', payload).then((r) => r.data);
  },

  getPagos(params = {}) {
    return apiGateway.get('/v1/pagos', { params }).then((r) => r.data);
  },

  registrarPago(payload) {
    return apiGateway.post('/v1/pagos', payload).then((r) => r.data);
  },
};

export default FACTURAS_API;
