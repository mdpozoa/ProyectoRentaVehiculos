import { apiClient } from './client';

export const loginAdmin = async (email, contrasena) => {
  const response = await apiClient.post('/api/v1/auth/login', { email, password: contrasena });
  
  const payload = response.data.data;
  
  if (payload?.user?.role !== 'ADMIN') {
    throw new Error('Acceso denegado: Se requieren permisos de administrador.');
  }
  
  return { usuario: payload.user, token: payload.token };
};

export const registerClient = async (clientData) => {
  const response = await apiClient.post('/api/v1/auth/register', clientData);
  return response.data;
};
