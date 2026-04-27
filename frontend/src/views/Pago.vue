<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import bookingService from '../services/bookingService';

const router = useRouter();

const reserva = ref(null);
const guardando = ref(false);
const error = ref('');
const pagado = ref(false);
const sincronizandoBooking = ref(false);
const contratoAceptado = ref(false);
const nombreFirma = ref(localStorage.getItem('user_name') || '');

const metodoPago = ref('Tarjeta');
const metodos = ['Tarjeta', 'Transferencia', 'Efectivo'];

onMounted(() => {
  const data = localStorage.getItem('reserva_activa');
  if (!data) { router.push('/vehiculos'); return; }
  reserva.value = JSON.parse(data);
});

// Cálculo simple del total (sin tarifa real por ahora)
const tarifaDiaria = 45; // valor base hasta conectar con tu tabla Tarifas
const subtotal = computed(() => (reserva.value?.dias || 0) * tarifaDiaria);
const iva = computed(() => subtotal.value * 0.15);
const total = computed(() => subtotal.value + iva.value);

const procesarPago = async () => {
  guardando.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error("No hay sesión activa. Por favor inicie sesión nuevamente.");
    }
    const payload = JSON.parse(atob(token.split('.')[1]));
    const idUsuario = parseInt(payload.id);

    if (!contratoAceptado.value || !nombreFirma.value) {
      throw new Error("Debe aceptar y firmar el contrato antes de proceder.");
    }

    // 1. Crear contrato
    const resContrato = await api.post('/Contratos', {
      ID_Reserva: reserva.value.idReserva,
      Ter_Con_Contrato: 'Términos y condiciones aceptados por el cliente: El arrendatario se compromete a devolver el vehículo en las mismas condiciones recibidas.',
      Firma_Contrato: nombreFirma.value
    });
    const contratoRaw = resContrato.data;
    console.log('DEBUG contrato:', JSON.stringify(contratoRaw));
    const idContrato = Array.isArray(contratoRaw)
      ? (contratoRaw[0]?.ID_Contrato ?? contratoRaw[0]?.id_contrato)
      : (contratoRaw?.ID_Contrato ?? contratoRaw?.id_contrato);
    if (!idContrato) throw new Error('No se pudo obtener el ID del contrato.');

    // 2. Crear factura
    const resFactura = await api.post('/Facturas', {
      ID_Contrato: idContrato,
      ID_Usuario: idUsuario,
      Numero_Factura: `FAC-${Date.now()}`,
      F_Emision_Factura: new Date().toISOString(),
      Subtotal_Factura: subtotal.value,
      IVA_Factura: iva.value,
      Total_Factura: total.value,
      M_Pago_Factura: metodoPago.value
    });
    // El ID puede venir en distintos formatos según el status code (201 vs 200)
    const facturaData = resFactura.data;
    console.log('DEBUG respuesta factura completa:', JSON.stringify(facturaData));
    // Intentar todas las formas posibles en que puede venir el ID
    const idFactura = facturaData?.ID_Factura
      ?? facturaData?.id_factura
      ?? (Array.isArray(facturaData) ? (facturaData[0]?.ID_Factura ?? facturaData[0]?.id_factura) : null);
    console.log('DEBUG idFactura extraido:', idFactura);

    // 3. Crear detalle de factura (no bloqueante si ya existe)
    try {
      await api.post('/DetalleFactura', {
        ID_Factura: idFactura,
        Descripcion_Detalle: `Renta de vehículo ${reserva.value.vehiculo?.Placa_Vehiculo} por ${reserva.value.dias} días`,
        Cantidad_Detalle: reserva.value.dias,
        Precio_Unitario_Detalle: tarifaDiaria,
        Subtotal_Detalle: subtotal.value
      });
    } catch (detErr) {
      console.warn('Detalle factura: ya existía o error menor, continuando...', detErr);
    }

    // 4. Registrar pago
    console.log('Registrando pago para factura ID:', idFactura);
    await api.post('/Pagos', {
      ID_Factura: idFactura,
      Fecha_Pago: new Date().toISOString(),
      Monto_Pago: total.value,
      Estado_Pago: 'Aprobado'  // ✅ Valor exacto del CHECK constraint en Supabase
    });
    console.log('Pago registrado correctamente');

    // 5. Actualizar estado de la reserva (no bloqueante)
    try {
      await api.put('/Reservas', {
        ID_Reserva: reserva.value.idReserva,
        ID_Usuario: idUsuario,
        ID_Vehiculo: reserva.value.vehiculo.ID_Vehiculo,
        ID_Agencia: reserva.value.vehiculo.ID_Agencia_Actual,
        F_Inicio_Reserva: reserva.value.inicio,
        F_Final_Reserva: reserva.value.fin,
        Estado_Reserva: 'Confirmada'
      });
      console.log('✅ Reserva actualizada a Confirmada');
    } catch (resErr) {
      console.warn('Estado reserva no actualizado (verificar constraint), pago exitoso de todas formas:', resErr);
    }

    // 6. Actualizar estado del vehículo a Reservado (no bloqueante)
    try {
      const veh = reserva.value.vehiculo;
      await api.put('/Vehiculos', {
        ID_Vehiculo:         veh.ID_Vehiculo,
        ID_Modelo:           veh.ID_Modelo,
        ID_Categoria:        veh.ID_Categoria,
        ID_Agencia_Actual:   veh.ID_Agencia_Actual,
        Placa_Vehiculo:      veh.Placa_Vehiculo,
        Color_Vehiculo:      veh.Color_Vehiculo,
        Anio_Vehiculo:       veh.Anio_Vehiculo,
        Kilometraje_Vehiculo:veh.Kilometraje_Vehiculo,
        Combustible_Vehiculo:veh.Combustible_Vehiculo,
        Estado_Vehiculo:     'Reservado'
      });
      console.log('✅ Vehículo marcado como Reservado');
    } catch (vehErr) {
      console.warn('No se pudo marcar el vehículo como Reservado (verificar constraint):', vehErr);
    }

    // 7. Sincronizar con servidor de Booking (no bloqueante)
    sincronizandoBooking.value = true;
    try {
      await bookingService.sendBookingData({
        factura: facturaData,
        reserva: reserva.value,
        cliente: { id: idUsuario, nombre: localStorage.getItem('user_name') }
      });
    } catch (bkErr) {
      console.warn('Booking API falló, pero el pago local se completó:', bkErr);
    } finally {
      sincronizandoBooking.value = false;
    }

    // 8. ✅ Limpiar y mostrar confirmación de pago exitoso
    localStorage.removeItem('reserva_activa');
    localStorage.removeItem('vehiculo_pendiente');
    pagado.value = true;

  } catch (err) {
    console.error(err);
    const serverDetail = err.response?.data?.detalle ? ` - ${err.response.data.detalle}` : '';
    error.value = (err.response?.data?.error || err.message || 'Error al procesar el pago') + serverDetail;
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <div class="pago-page">

    <!-- CONFIRMACIÓN -->
    <div v-if="pagado" class="confirmacion">
      <div class="check-icon">✓</div>
      <h1>¡Pago exitoso!</h1>
      <p>Tu reserva está confirmada. Recibirás los detalles en tu correo.</p>
      <button class="btn-primary" @click="router.push('/')">Volver al inicio</button>
    </div>

    <!-- FORMULARIO DE PAGO -->
    <div v-else-if="reserva" class="pago-contenido">

      <div class="pago-header">
        <button class="btn-volver" @click="router.back()">← Atrás</button>
        <h1>Procesar pago</h1>
      </div>

      <div class="pago-layout">

        <!-- Contrato y Firma -->
        <div class="card">
          <h2>Contrato de Renta</h2>
          <div class="contrato-texto">
            <p><strong>Términos:</strong> El arrendatario acepta la responsabilidad total del vehículo durante el periodo de renta. Se compromete a devolverlo con el mismo nivel de combustible y sin daños adicionales. El seguro cubre daños a terceros según la póliza contratada.</p>
          </div>
          <div class="campo">
            <label>Firma electrónica (Escribe tu nombre completo)</label>
            <input type="text" v-model="nombreFirma" placeholder="Ej: Juan Pérez" />
          </div>
          <label class="checkbox-container">
            <input type="checkbox" v-model="contratoAceptado" />
            <span class="checkmark"></span>
            Acepto los términos y condiciones del contrato de renta.
          </label>
        </div>

        <!-- Método de pago -->
        <div class="card" :class="{ 'seccion-bloqueada': !contratoAceptado || !nombreFirma }">
          <h2>Método de pago</h2>

          <div class="metodos">
            <button
              v-for="m in metodos"
              :key="m"
              class="metodo-btn"
              :class="{ activo: metodoPago === m }"
              @click="metodoPago = m"
            >
              <span>{{ m === 'Tarjeta' ? '💳' : m === 'Transferencia' ? '🏦' : '💵' }}</span>
              {{ m }}
            </button>
          </div>

          <!-- Campos simulados de tarjeta -->
          <div v-if="metodoPago === 'Tarjeta'" class="campos-tarjeta">
            <div class="campo">
              <label>Número de tarjeta</label>
              <input type="text" placeholder="1234 5678 9012 3456" maxlength="19" />
            </div>
            <div class="campo-row">
              <div class="campo">
                <label>Vencimiento</label>
                <input type="text" placeholder="MM/AA" maxlength="5" />
              </div>
              <div class="campo">
                <label>CVV</label>
                <input type="text" placeholder="123" maxlength="3" />
              </div>
            </div>
            <div class="campo">
              <label>Nombre en la tarjeta</label>
              <input type="text" placeholder="JUAN PEREZ" />
            </div>
          </div>

          <div v-if="metodoPago === 'Transferencia'" class="info-transferencia">
            <p>Realiza la transferencia a:</p>
            <p><strong>Banco:</strong> Banco Pichincha</p>
            <p><strong>Cuenta:</strong> 2201234567</p>
            <p><strong>A nombre de:</strong> Zenith Drive S.A.</p>
          </div>

          <div v-if="metodoPago === 'Efectivo'" class="info-transferencia">
            <p>Paga en efectivo al momento de retirar el vehículo en la agencia.</p>
          </div>

          <div v-if="error" class="error-msg">{{ error }}</div>

          <button
            class="btn-primary btn-block"
            :disabled="guardando"
            @click="procesarPago"
          >
            {{ guardando ? 'Procesando...' : `Pagar $${total.toFixed(2)}` }}
          </button>
        </div>

        <!-- Resumen del pedido -->
        <div class="card resumen">
          <h2>Resumen del pedido</h2>

          <div class="resumen-vehiculo">
            <div class="vehiculo-icono">🚗</div>
            <div>
              <p class="vehiculo-placa">{{ reserva.vehiculo?.Placa_Vehiculo }}</p>
              <p class="vehiculo-det">{{ reserva.vehiculo?.Color_Vehiculo }} · {{ reserva.vehiculo?.Anio_Vehiculo }}</p>
            </div>
          </div>

          <div class="resumen-fechas">
            <div class="fecha-item">
              <span class="fecha-label">Recogida</span>
              <span class="fecha-val">{{ reserva.inicio }}</span>
            </div>
            <div class="flecha">→</div>
            <div class="fecha-item">
              <span class="fecha-label">Devolución</span>
              <span class="fecha-val">{{ reserva.fin }}</span>
            </div>
          </div>

          <div class="resumen-lineas">
            <div class="resumen-linea">
              <span>{{ reserva.dias }} día{{ reserva.dias > 1 ? 's' : '' }} × ${{ tarifaDiaria }}</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="resumen-linea">
              <span>IVA (15%)</span>
              <span>${{ iva.toFixed(2) }}</span>
            </div>
            <div class="resumen-linea total">
              <span>Total</span>
              <span>${{ total.toFixed(2) }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.pago-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.pago-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.pago-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.btn-volver {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  color: #aaa;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-volver:hover { color: white; }

.pago-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.contrato-texto {
  background: rgba(0,0,0,0.2);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #ccc;
  border-left: 3px solid var(--primary);
}

.seccion-bloqueada {
  opacity: 0.4;
  pointer-events: none;
  filter: grayscale(1);
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #eee;
  cursor: pointer;
}

.checkbox-container input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Métodos de pago */
.metodos { display: flex; gap: 0.75rem; }

.metodo-btn {
  flex: 1;
  padding: 0.65rem 0.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: #aaa;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.metodo-btn.activo {
  border-color: var(--primary, #f97316);
  color: var(--primary, #f97316);
  background: rgba(249,115,22,0.1);
}

/* Campos tarjeta */
.campos-tarjeta { display: flex; flex-direction: column; gap: 1rem; }

.campo { display: flex; flex-direction: column; gap: 6px; }
.campo-row { display: flex; gap: 1rem; }
.campo-row .campo { flex: 1; }

.campo label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
}

.campo input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  color: white;
  font-size: 0.95rem;
}

.campo input:focus {
  outline: none;
  border-color: var(--primary, #f97316);
}

.info-transferencia {
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  padding: 1rem;
  color: #aaa;
  font-size: 0.9rem;
  line-height: 1.8;
}

.info-transferencia strong { color: white; }

.btn-block { width: 100%; }

.btn-primary {
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  background: var(--primary, #f97316);
  color: white;
  font-weight: 700;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
}

.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { opacity: 0.85; }

.error-msg {
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

/* Resumen */
.resumen-vehiculo {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.vehiculo-icono { font-size: 2.5rem; }
.vehiculo-placa { color: var(--primary, #f97316); font-weight: 700; font-size: 1.05rem; margin: 0; }
.vehiculo-det { color: #888; font-size: 0.85rem; margin: 2px 0; }

.resumen-fechas {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  padding: 0.85rem;
}

.fecha-item { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.fecha-label { font-size: 0.72rem; color: #666; text-transform: uppercase; }
.fecha-val { color: white; font-weight: 600; font-size: 0.9rem; }
.flecha { color: #555; font-size: 1.2rem; }

.resumen-lineas { display: flex; flex-direction: column; gap: 0.75rem; }

.resumen-linea {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #aaa;
}

.resumen-linea.total {
  font-weight: 700;
  color: white;
  font-size: 1.1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255,255,255,0.08);
}

/* Confirmación */
.confirmacion {
  text-align: center;
  padding: 5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.check-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(34,197,94,0.15);
  border: 2px solid #22c55e;
  color: #22c55e;
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirmacion h1 { color: white; font-size: 2rem; margin: 0; }
.confirmacion p { color: #888; font-size: 1rem; }

@media (max-width: 640px) {
  .pago-layout { grid-template-columns: 1fr; }
  .metodos { flex-direction: column; }
}
</style>