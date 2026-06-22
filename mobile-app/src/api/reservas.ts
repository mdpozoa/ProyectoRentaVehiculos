import { apiClient } from './client';

export interface ReservaRequest {
  vehiculoId: string;
  fechaInicio: string;
  fechaFin: string;
}

// Crear reserva - usa /api/v1/bus/reservas según el nginx.conf y orquestador
export const createReserva = async (data: ReservaRequest) => {
  const response = await apiClient.post('/api/v1/bus/reservas', data);
  return response.data;
};

// Obtener reservas del usuario actual
export const fetchMisReservas = async () => {
  const response = await apiClient.get('/api/v1/reservas/my');
  return response.data;
};

// Cancelar una reserva
export const cancelReserva = async (reservaId: string) => {
  const response = await apiClient.post(`/api/v1/bus/reservas/${reservaId}/cancelar`);
  return response.data;
};
