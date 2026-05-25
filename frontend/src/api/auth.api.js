/**
 * src/api/auth.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Todas las llamadas HTTP relacionadas con autenticación y perfil de usuario.
 * Usa apiAuth → auth-service Node.js en :3001
 *
 * NUNCA pongas lógica de negocio aquí. Solo fetch + return data.
 * La lógica va en el store (stores/auth.store.js).
 */

import { apiAuth } from '@/services/http.js';

const AUTH_API = {
  /**
   * Iniciar sesión.
   * @param {{ email: string, password: string }} credentials
   * @returns {{ token: string, user: object }}
   */
  login(credentials) {
    return apiAuth.post('/v1/auth/login', credentials).then((r) => r.data);
  },

  /**
   * Registrar nuevo usuario.
   * @param {{ nombre: string, email: string, password: string, rol?: string }} payload
   */
  register(payload) {
    return apiAuth.post('/v1/auth/register', payload).then((r) => r.data);
  },

  /**
   * Obtener el perfil del usuario autenticado (requiere token).
   */
  me() {
    return apiAuth.get('/v1/auth/me').then((r) => r.data);
  },

  /**
   * Actualizar datos del perfil (requiere token).
   * @param {{ nombre?: string, telefono?: string }} updates
   */
  updateProfile(updates) {
    return apiAuth.patch('/v1/auth/me', updates).then((r) => r.data);
  },
};

export default AUTH_API;
