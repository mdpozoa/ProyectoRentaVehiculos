/**
 * Servicio para la integración con el servidor externo de Booking.
 */
class BookingService {
  /**
   * Envía los datos de la reserva y factura al servidor de Booking.
   * @param {Object} data - Datos combinados de la reserva, factura y cliente.
   */
  async sendBookingData(data) {
    console.log('--- ENVIANDO DATOS A BOOKING SERVER ---');
    console.log(data);

    // URL del servidor booking (reemplazar con la URL real cuando esté disponible)
    const BOOKING_API_URL = 'https://api.booking-external.com/v1/sync';

    try {
      // Usamos fetch directamente para evitar interceptores de nuestra API local si fuera necesario
      /* 
      const response = await fetch(BOOKING_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_BOOKING_TOKEN' // Si requiere token
        },
        body: JSON.stringify(data)
      });
      return await response.json();
      */
      
      // Simulación de éxito
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('✅ Sincronización con Booking exitosa');
          resolve({ success: true, ref: 'BK-' + Date.now() });
        }, 1500);
      });

    } catch (error) {
      console.error('❌ Error al sincronizar con el servidor de Booking:', error);
      throw error;
    }
  }
}

export default new BookingService();
