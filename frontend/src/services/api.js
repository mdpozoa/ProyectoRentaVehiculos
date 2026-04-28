import axios from 'axios';

// URL dinámica: usa localhost si estás programando, o Railway si estás en producción (Vercel/Celular)
// URL de la API: En producción usa Railway, en desarrollo local usa localhost
const baseURL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('vercel.app') 
    ? 'https://scintillating-warmth-production-d1f6.up.railway.app/api'
    : 'http://localhost:5191/api');

console.log(`[API] URL Base detectada: ${baseURL}`);

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
