<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();
const reservas = ref([]);
const cargando = ref(true);
const error = ref('');

const fetchReservas = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    router.push('/login');
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const idUsuario = parseInt(payload.id);

    // Obtener todas las reservas y filtrar por el ID del usuario logueado
    const res = await api.get('/Reservas');
    
    reservas.value = res.data
      .filter(r => r.ID_Usuario === idUsuario)
      .sort((a,b) => new Date(b.F_Inicio_Reserva) - new Date(a.F_Inicio_Reserva));
      
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.detalle || err.message || 'Error al cargar tus reservas.';
  } finally {
    cargando.value = false;
  }
};

onMounted(fetchReservas);

const cancelarReserva = async (id) => {
  if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
  
  try {
    // Si la API lo permite, llamamos a DELETE
    await api.delete(`/Reservas/${id}`);
    await fetchReservas(); // Recargar la lista
    alert('Reserva cancelada exitosamente.');
  } catch (err) {
    alert('No se pudo cancelar la reserva. Es posible que ya esté procesada o haya un error de permisos.');
  }
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const f = new Date(fechaStr);
  return f.toLocaleDateString();
};

const getEstadoColor = (estado) => {
  switch (estado) {
    case 'Pendiente': return '#f59e0b'; // amber
    case 'Pagada': return '#10b981'; // emerald
    case 'Cancelada': return '#ef4444'; // red
    case 'Completada': return '#3b82f6'; // blue
    default: return '#888';
  }
};

const continuarPago = async (reserva) => {
  try {
    // 1. Calcular días
    const start = new Date(reserva.F_Inicio_Reserva);
    const end = new Date(reserva.F_Final_Reserva);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 2. Obtener detalles del vehículo (necesarios para el resumen de pago)
    const resVehiculo = await api.get(`/Vehiculos/${reserva.ID_Vehiculo}`);
    const vehiculo = resVehiculo.data;

    // 3. Preparar objeto reserva_activa
    const reservaData = {
      idReserva: reserva.ID_Reserva,
      dias: diffDays,
      inicio: reserva.F_Inicio_Reserva.split('T')[0],
      fin: reserva.F_Final_Reserva.split('T')[0],
      vehiculo: vehiculo
    };

    // 4. Guardar en localStorage y navegar
    localStorage.setItem('reserva_activa', JSON.stringify(reservaData));
    router.push('/pago');
  } catch (err) {
    alert('No se pudo preparar el pago. Intente nuevamente.');
    console.error(err);
  }
};
</script>

<template>
  <div class="mis-reservas container">
    <div class="header">
      <h1>Mis Reservas</h1>
      <p class="text-muted">Revisa el historial y estado de tus rentas.</p>
    </div>

    <div v-if="cargando" class="estado-msg">Cargando reservas...</div>
    <div v-else-if="error" class="estado-msg error">{{ error }}</div>
    <div v-else-if="reservas.length === 0" class="estado-msg">
      <div class="empty-icon">🚗</div>
      <h2>Aún no tienes reservas</h2>
      <p>Explora nuestro catálogo y alquila el vehículo perfecto para ti.</p>
      <button class="btn-primary mt-3" @click="router.push('/vehiculos')">Ir al Catálogo</button>
    </div>

    <div v-else class="reservas-grid">
      <div v-for="reserva in reservas" :key="reserva.ID_Reserva" class="reserva-card">
        <div class="reserva-header">
          <span class="reserva-id">Reserva #{{ reserva.ID_Reserva }}</span>
          <span class="reserva-estado" :style="{ backgroundColor: getEstadoColor(reserva.Estado_Reserva) + '22', color: getEstadoColor(reserva.Estado_Reserva) }">
            {{ reserva.Estado_Reserva }}
          </span>
        </div>
        
        <div class="reserva-body">
          <div class="info-item">
            <span class="label">Fechas</span>
            <span class="valor">{{ formatearFecha(reserva.F_Inicio_Reserva) }} - {{ formatearFecha(reserva.F_Final_Reserva) }}</span>
          </div>
          
          <div class="info-item">
            <span class="label">ID Vehículo</span>
            <span class="valor">Auto #{{ reserva.ID_Vehiculo }}</span>
          </div>
        </div>

        <div v-if="reserva.Estado_Reserva === 'Pendiente'" class="reserva-footer">
          <p class="text-muted text-small">Esta reserva aún no ha sido pagada.</p>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn-pagar" style="flex:1;" @click="continuarPago(reserva)">Continuar al Pago</button>
            <button class="btn-eliminar" @click="cancelarReserva(reserva.ID_Reserva)">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mis-reservas {
  padding: 4rem 1rem;
  min-height: calc(100vh - 100px);
}

.header {
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary, #f97316);
  margin-bottom: 0.5rem;
}

.estado-msg {
  text-align: center;
  padding: 4rem 1rem;
  background: rgba(255,255,255,0.02);
  border-radius: 16px;
  border: 1px dashed rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.estado-msg.error {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  background: var(--primary, #f97316);
  color: white;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover { opacity: 0.9; }

.mt-3 { margin-top: 1rem; }

.reservas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.reserva-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s;
}

.reserva-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.15);
}

.reserva-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 1rem;
}

.reserva-id {
  font-weight: 700;
  color: white;
}

.reserva-estado {
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.reserva-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.valor {
  color: #eee;
  font-weight: 500;
}

.reserva-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.text-small { font-size: 0.8rem; }

.btn-pagar {
  background: transparent;
  border: 1px solid var(--primary, #f97316);
  color: var(--primary, #f97316);
  padding: 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pagar:hover {
  background: var(--primary, #f97316);
  color: white;
}

.btn-eliminar {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-eliminar:hover {
  background: #ef4444;
  color: white;
}
</style>
