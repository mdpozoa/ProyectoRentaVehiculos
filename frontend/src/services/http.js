/**
 * src/services/http.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Instancias Axios centralizadas para Zenith Drive.
 *
 * REGLA DE ORO:
 *   - Llamadas de AUTH  → apiAuth    (auth-service Node.js :3001)
 *   - Resto de la app   → apiGateway (YARP Gateway :5050)
 *   - Legado/monolito   → apiMonolith (.NET :5192) — solo si no pasó al gateway
 *
 * USO EN COMPONENTES:
 *   import { apiAuth, apiGateway } from '@/services/http.js'
 */

import axios from 'axios';

// ─── Lectura de variables de entorno (Vite expone sólo VITE_*) ───────────────
const ENV = {
  monolith : import.meta.env.VITE_API_MONOLITH  ?? 'http://localhost:5192/api',
  gateway  : import.meta.env.VITE_API_GATEWAY   ?? 'http://localhost:5050/api',
  auth     : import.meta.env.VITE_API_AUTH      ?? 'http://localhost:3001/api',
};

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

if (!isLocalHost) {
  ENV.monolith = 'https://scintillating-warmth-production-d1f6.up.railway.app/api';
  ENV.gateway  = '/api';
  ENV.auth     = '/api';
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Lee el JWT del localStorage */
function readToken() {
  return localStorage.getItem('auth_token') ?? null;
}

/**
 * Interceptor de REQUEST: inyecta el Bearer token si existe.
 * No modifica nada si el usuario no ha iniciado sesión.
 */
function injectBearerToken(config) {
  const token = readToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

/**
 * Interceptor de RESPONSE: maneja errores globales.
 *   401 → limpia sesión y redirige a /login
 *   503 → avisa que el microservicio está caído
 */
function handleResponseError(error) {
  const status = error.response?.status;

  if (status === 401) {
    console.warn('[HTTP] Token inválido o expirado — limpiando sesión');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (status === 503) {
    console.error('[HTTP] Servicio no disponible (503). Verifica que el backend esté corriendo.');
  }

  return Promise.reject(error);
}

// ─── Fábrica de instancias ────────────────────────────────────────────────────

/**
 * Crea una instancia Axios con:
 *  - baseURL configurada
 *  - timeout de 10 s para evitar requests colgados
 *  - interceptores de token y errores globales
 */
function createInstance(baseURL) {
  const instance = axios.create({
    baseURL,
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Adjuntar token en cada petición saliente
  instance.interceptors.request.use(injectBearerToken, Promise.reject);

  // Manejar errores de forma centralizada
  instance.interceptors.response.use((response) => response, handleResponseError);

  return instance;
}

function normalizeApiBase(url) {
  return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
}

// ─── Instancias exportadas ────────────────────────────────────────────────────

/**
 * apiAuth → auth-service Node.js
 * Base: http://localhost:3001/api  (dev)
 *
 * Ejemplos:
 *   apiAuth.post('/v1/auth/login', { email, password })
 *   apiAuth.post('/v1/auth/register', payload)
 *   apiAuth.get('/v1/auth/me')
 */
export const apiAuth = createInstance(normalizeApiBase(ENV.auth));

/**
 * apiGateway → YARP API Gateway (.NET)
 * Base: http://localhost:5050/api  (dev)
 *
 * Punto de entrada ÚNICO para todo lo que no es auth:
 *   apiGateway.get('/v1/vehiculos')
 *   apiGateway.post('/v1/reservas', payload)
 *   apiGateway.get('/v1/facturas/5')
 */
export const apiGateway = createInstance(normalizeApiBase(ENV.gateway));

/**
 * apiMonolith → Monolito ASP.NET Core (legado)
 * Base: http://localhost:5192/api  (dev)
 *
 * Solo usar para endpoints que aún no migraron al gateway.
 * Preferir apiGateway para todo lo nuevo.
 */
export const apiMonolith = createInstance(ENV.monolith);

// ─── Compatibilidad hacia atrás ───────────────────────────────────────────────
// Componentes que hacen `import api from '@/services/api'` siguen funcionando.
export default apiMonolith;
