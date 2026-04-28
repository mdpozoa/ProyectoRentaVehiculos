import axios from 'axios';
// Last updated: 2026-04-27 20:20

// URL dinámica: usa localhost si estás programando, o Railway si estás en producción (Vercel/Celular)
// URL de la API: En producción (Vercel) siempre Railway, en desarrollo localhost
// URL de la API: En producción (Vercel) siempre Railway, en desarrollo localhost
// URL definitiva: Si detecta Vercel, usa Railway. Si no, usa localhost.
const baseURL = window.location.hostname.includes('vercel.app')
  ? 'https://scintillating-warmth-production-d1f6.up.railway.app/api'
  : 'http://localhost:5191/api';

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

export default api;
