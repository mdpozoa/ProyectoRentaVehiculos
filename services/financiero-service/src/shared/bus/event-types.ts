/**
 * event-types.ts — Tipos de eventos de integración del bus urbancar-eventos.
 * Definición canónica de todos los Integration Events del sistema Zenith Drive.
 */

/** Tipos de eventos publicados en el topic `urbancar-eventos` */
export type IntegrationEventType =
  | 'RESERVA_CREADA'
  | 'RESERVA_CANCELADA'
  | 'ALQUILER_INICIADO'
  | 'ALQUILER_CANCELADO'
  | 'DEVOLUCION_REGISTRADA'
  | 'PAGO_COMPLETADO'
  | 'PAGO_FALLIDO'
  | 'MANTENIMIENTO_INICIADO'
  | 'MANTENIMIENTO_COMPLETADO';

/** Estructura base de un evento de integración */
export interface IntegrationEvent<T = Record<string, unknown>> {
  id:          string;
  tipo:        IntegrationEventType;
  usuarioId:   string;
  entidadId:   string;
  payload:     T;
  publicadoEn: string;
  destino:     'azure-service-bus' | 'local';
}

// ── Payloads de eventos específicos ──────────────────────────────────────────

export interface DevolucionRegistradaPayload {
  alquilerId:      string;
  reservaId?:      string;
  vehiculoId:      string;
  kmEntrada?:      number;
  estadoVehiculo?: string;
  cargoExtra?:     number;
  correlationId?:  string;
}

export interface ReservaCreadaPayload {
  reservaId:     string;
  vehiculoId:    string;
  agenciaId:     string;
  usuarioId:     string;
  fechaInicio:   string;
  fechaFin:      string;
  totalAmount:   number;
  correlationId?: string;
}

export interface AlquilerIniciadoPayload {
  alquilerId:    string;
  reservaId:     string;
  vehiculoId:    string;
  kmSalida?:     number;
  fechaInicio:   string;
  correlationId?: string;
}

export interface PagoPayload {
  pagoId:       string;
  reservaId:    string;
  monto:        number;
  metodoPago?:  string;
  referencia?:  string;
  motivoFalla?: string;
  correlationId?: string;
}
