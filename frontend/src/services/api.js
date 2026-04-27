import axios from 'axios';

// URL dinámica: usa localhost si estás programando, o Railway si estás en producción (Vercel/Celular)
const hostname = window.location.hostname;
const baseURL = (hostname === 'localhost' || hostname === '127.0.0.1')
  ? 'http://localhost:5191/api'
  : 'https://scintillating-warmth-production-d1f6.up.railway.app/api'; 

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
