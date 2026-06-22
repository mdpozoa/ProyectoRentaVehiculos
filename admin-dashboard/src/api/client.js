import axios from 'axios';

// Usar URL relativa para que funcione tanto en localhost como en Localtunnel/producción
// El navegador enviará las requests al mismo origen que sirve el frontend (Nginx)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
