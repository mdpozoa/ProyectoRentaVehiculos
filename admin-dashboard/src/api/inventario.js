import { apiClient } from './client';

export const getVehiculos = async (page = 1, limit = 10) => {
  const response = await apiClient.get('/api/v2/mateodavid/inventario/vehiculos', {
    params: { page, limit }
  });
  return response.data;
};

export const updateVehiculoStatus = async (id, status) => {
  const response = await apiClient.patch(`/api/v1/vehiculos/${id}`, { status });
  return response.data;
};
