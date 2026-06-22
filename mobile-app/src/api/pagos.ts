import { apiClient } from './client';

export interface PagoRequest {
  reservaId: string;
  monto: number;
  metodoPago: string; // Ej: 'TARJETA', 'TRANSFERENCIA'
  referencia?: string;
}

export const crearPago = async (data: PagoRequest) => {
  const response = await apiClient.post('/api/v1/pagos', data);
  return response.data;
};
