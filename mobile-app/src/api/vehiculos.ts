import { apiClient } from './client';

export interface Vehiculo {
  id: string;
  nombre: string;
  descripcion: string;
  precioPorDia: number;
  moneda: string;
  categoria: string | null;
  disponible: boolean;
  status: string;
  imagenUrl: string | null;
  agenciaId: string | null;
}

export interface VehiculosResponse {
  success: boolean;
  data: {
    data: Vehiculo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VehiculoDetailResponse {
  success: boolean;
  data: Vehiculo;
}

// Lista paginada de vehículos disponibles
export const fetchVehiculos = async (page = 1, limit = 10): Promise<VehiculosResponse> => {
  const response = await apiClient.get('/api/v1/vehiculos', {
    params: { page, limit, disponible: true },
  });
  return response.data;
};

// Detalle de un vehículo por ID
export const fetchVehiculoById = async (id: string): Promise<VehiculoDetailResponse> => {
  const response = await apiClient.get(`/api/v1/vehiculos/${id}`);
  return response.data;
};
