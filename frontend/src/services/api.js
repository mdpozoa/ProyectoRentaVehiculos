import axios from 'axios';
// Last updated: 2026-04-27 20:20

// URL dinámica: usa localhost/IP local si estás programando, o el gateway relativo /api en producción
const envBaseUrl = import.meta.env.VITE_API_MONOLITH || 'http://localhost:5192/api';
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const baseURL = isLocalHost
  ? envBaseUrl
  : 'https://scintillating-warmth-production-d1f6.up.railway.app/api';

console.log(`[DEBUG] Host: ${window.location.hostname}, API: ${baseURL}`);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token (si tu backend C# implementa JWT)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas (especialmente 401)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada o no autorizada. Redirigiendo a login...');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      // No podemos usar router aquí fácilmente, así que usamos window.location
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
