import { apiClient } from './client';

// El auth-service espera el campo "password" (no "contrasena")
export const login = async (email: string, password: string) => {
  const response = await apiClient.post('/api/v1/auth/login', { email, password });
  return response.data;
};

export const register = async (email: string, nombres: string, apellidos: string, password: string) => {
  const response = await apiClient.post('/api/v1/auth/register', {
    email, nombres, apellidos, password
  });
  return response.data;
};
