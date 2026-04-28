<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();

const vehiculo = ref(null);
const cargando = ref(true);
const guardando = ref(false);
const error = ref('');

const inicio = ref('');
const fin = ref('');
const agencias = ref([]);
const agenciaSeleccionada = ref('');

onMounted(async () => {
  const idVehiculo = route.params.id;
  try {
    const res = await api.get(`/Vehiculos/${idVehiculo}`);
    vehiculo.value = res.data;

    const resAgencias = await api.get('/Agencias');
    agencias.value = resAgencias.data;
    if (agencias.value.length > 0) {
      agenciaSeleccionada.value = agencias.value[0].ID_Agencia;
    }
  } catch (err) {
    error.value = 'No se pudo cargar la información necesaria.';
  } finally {
    cargando.value = false;
  }
});

// Validar que fin sea después de inicio y que inicio sea hoy o después
const fechaMinima = computed(() => {
  const hoy = new Date();
  return hoy.toISOString().split('T')[0];
});

// Utilidad para sumar días sin problemas de zona horaria
const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

const fechaMinimaFin = computed(() => {
  if (!inicio.value) return fechaMinima.value;
  return addDays(inicio.value, 1);
});

const fechaMaximaFin = computed(() => {
  if (!inicio.value) return '';
  return addDays(inicio.value, 7);
});

const dias = computed(() => {
  if (!inicio.value || !fin.value) return 0;
  const [y1, m1, d1] = inicio.value.split('-').map(Number);
  const [y2, m2, d2] = fin.value.split('-').map(Number);
  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  const diffTime = end - start;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
});

const confirmarReserva = async () => {
  if (!inicio.value || !fin.value) {
    error.value = 'Por favor selecciona las fechas de inicio y fin.';
    return;
  }
  if (dias.value <= 0) {
    error.value = 'La fecha de fin debe ser posterior a la de inicio.';
    return;
  }

  guardando.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('auth_token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const idUsuario = parseInt(payload.id);

    // 1. Crear la reserva en la BD
    const resReserva = await api.post('/Reservas', {
      ID_Usuario: idUsuario,
      ID_Vehiculo: vehiculo.value.ID_Vehiculo,
      ID_Agencia: agenciaSeleccionada.value,
      F_Inicio_Reserva: new Date(inicio.value).toISOString(),
      F_Final_Reserva: new Date(fin.value).toISOString(),
      Estado_Reserva: 'Pendiente'
    });

    const idReserva = resReserva.data?.ID_Reserva;

    if (!idReserva) {
      throw new Error("No se devolvió el ID de la reserva.");
    }

    // 2. Preparar los datos para la pantalla de pago
    const reservaData = {
      idReserva: idReserva,
      dias: dias.value,
      inicio: inicio.value,
      fin: fin.value,
      vehiculo: vehiculo.value
    };

    localStorage.setItem('reserva_activa', JSON.stringify(reservaData));
    router.push('/pago');

  } catch (err) {
    console.error(err);
    const serverError = err.response?.data?.detalle || err.response?.data?.error || 'Error al procesar la reserva. Intenta nuevamente.';
    error.value = serverError;
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <div class="reservar-page">
    <div class="reservar-card">
      <div class="header">
        <button class="btn-volver" @click="router.back()">← Atrás</button>
        <h1>Detalles de Reserva</h1>
      </div>

      <div v-if="cargando" class="estado-msg">Cargando vehículo...</div>
      <div v-else-if="error && !vehiculo" class="estado-msg error">{{ error }}</div>
      
      <div v-else class="contenido">
        
        <!-- INFO DEL VEHÍCULO -->
        <div class="vehiculo-info">
          <div class="vehiculo-icono">🚗</div>
          <div class="vehiculo-detalles">
            <h2>{{ vehiculo.Placa_Vehiculo }}</h2>
            <p>{{ vehiculo.Color_Vehiculo }} · {{ vehiculo.Anio_Vehiculo }}</p>
            <div class="tags">
              <span class="tag">{{ vehiculo.Combustible_Vehiculo }}</span>
              <span class="tag">{{ vehiculo.Kilometraje_Vehiculo?.toLocaleString() }} km</span>
            </div>
          </div>
        </div>

        <hr class="divisor" />

        <!-- AGENCIA Y FECHAS -->
        <div class="formulario">
          <div class="campo" style="margin-bottom: 1.5rem;">
            <label>Agencia de Retiro</label>
            <select v-model="agenciaSeleccionada">
              <option v-for="agencia in agencias" :key="agencia.ID_Agencia" :value="agencia.ID_Agencia">
                {{ agencia.Nombre_Agencia }} - {{ agencia.Direccion_Agencia }}
              </option>
            </select>
          </div>

          <h3>Selecciona las fechas (Máx 7 días)</h3>
          
          <div class="fechas-grid">
            <div class="campo">
              <label>Fecha de Recogida</label>
              <input 
                type="date" 
                v-model="inicio" 
                :min="fechaMinima" 
                @change="fin = ''"
              />
            </div>
            
            <div class="campo">
              <label>Fecha de Devolución</label>
              <input 
                type="date" 
                v-model="fin" 
                :min="fechaMinimaFin" 
                :max="fechaMaximaFin"
                :disabled="!inicio"
              />
            </div>
          </div>

          <div v-if="dias > 0" class="resumen-dias">
            <div class="icono-reloj">⏱️</div>
            <div>
              <strong>Duración de la renta:</strong> {{ dias }} día{{ dias > 1 ? 's' : '' }}
            </div>
          </div>

          <div v-if="error" class="error-msg">{{ error }}</div>

          <button 
            class="btn-primary btn-block" 
            :disabled="guardando || dias <= 0"
            @click="confirmarReserva"
          >
            {{ guardando ? 'Procesando...' : 'Confirmar y Pagar →' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.reservar-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.reservar-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
}

.header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.5rem;
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

.btn-volver:hover {
  color: white;
  background: rgba(255,255,255,0.1);
}

.estado-msg {
  text-align: center;
  padding: 2rem;
  color: #888;
}

.estado-msg.error {
  color: #f87171;
}

.vehiculo-info {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.vehiculo-icono {
  font-size: 4rem;
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vehiculo-detalles h2 {
  font-size: 1.5rem;
  color: var(--primary, #f97316);
  margin: 0 0 0.25rem 0;
}

.vehiculo-detalles p {
  color: #aaa;
  margin: 0 0 0.75rem 0;
}

.tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  background: rgba(255,255,255,0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
}

.divisor {
  border: 0;
  height: 1px;
  background: rgba(255,255,255,0.1);
  margin: 2rem 0;
}

.formulario h3 {
  font-size: 1.1rem;
  color: white;
  margin-top: 0;
  margin-bottom: 1rem;
}

.fechas-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.campo label {
  font-size: 0.85rem;
  color: #aaa;
}

.campo input, .campo select {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-family: inherit;
  width: 100%;
}

.campo input:focus, .campo select:focus {
  outline: none;
  border-color: var(--primary, #f97316);
}

.campo select option {
  background: #1e1e1e;
  color: white;
}

.campo input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resumen-dias {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.2);
  padding: 1rem;
  border-radius: 8px;
  color: #4ade80;
  margin-bottom: 1.5rem;
}

.icono-reloj {
  font-size: 1.5rem;
}

.btn-block {
  width: 100%;
}

.btn-primary {
  padding: 1rem;
  border-radius: 10px;
  background: var(--primary, #f97316);
  color: white;
  font-weight: 700;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.error-msg {
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
</style>
