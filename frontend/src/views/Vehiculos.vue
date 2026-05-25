<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// Usamos el API Gateway para consultar al inventario-service (endpoint de booking)
import { apiGateway } from '../services/http.js';

const router = useRouter();
const vehiculos = ref([]);
const cargando = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    // GET /v1/vehiculos/booking -> inventario-service
    const res = await apiGateway.get('/v1/vehiculos/booking');
    console.log('[DEBUG] Vehículos (Booking API) response:', res.data);
    const responseData = res.data;
    
    // El booking DTO devuelve { success: true, data: { data: [...] } }
    if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
      vehiculos.value = responseData.data.data;
    } else {
      vehiculos.value = [];
    }
    console.log('[DEBUG] Vehículos cargados:', vehiculos.value.length);
  } catch (err) {
    console.error('[ERROR] Error cargando vehículos:', err);
    error.value = 'No se pudieron cargar los vehículos.';
  } finally {
    cargando.value = false;
  }
});

const isDisponible = (v) => {
  return v.disponible;
};

const getStatusText = (v) => {
  return v.status || 'No disponible';
};

const reservar = (vehiculo) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    localStorage.setItem('vehiculo_pendiente', JSON.stringify(vehiculo));
    router.push('/login');
    return;
  }
  router.push({ name: 'reservar', params: { id: vehiculo.id } });
};
</script>

<template>
  <div class="catalogo">
    <div class="catalogo-header">
      <h1>Catálogo de vehículos</h1>
      <p>Selecciona el vehículo que deseas reservar</p>
    </div>

    <div v-if="cargando" class="estado-msg">Cargando vehículos...</div>
    <div v-else-if="error" class="estado-msg error">{{ error }}</div>
    <div v-else-if="vehiculos.length === 0" class="estado-msg">No hay vehículos disponibles en este momento.</div>

    <div v-else class="vehiculos-grid">
      <div
        v-for="v in vehiculos"
        :key="v.id"
        class="vehiculo-card"
        :class="{ 'no-disponible': !isDisponible(v) }"
      >
        <div class="card-badge" :class="isDisponible(v) ? 'badge-ok' : 'badge-no'">
          {{ getStatusText(v) }}
        </div>

        <div class="card-imagen-wrapper">
          <img v-if="v.imagenUrl" :src="v.imagenUrl" :alt="v.nombre" class="card-imagen" />
          <div v-else class="card-icono">🚗</div>
        </div>

        <div class="card-info">
          <h3>{{ v.nombre }}</h3>
          <p class="categoria">{{ v.categoria }}</p>

          <div class="card-detalles">
            <span>{{ v.moneda }} {{ v.precioPorDia }} / día</span>
          </div>
          <p class="descripcion" v-if="v.descripcion">{{ v.descripcion }}</p>
        </div>

        <button
          class="btn-reservar"
          :disabled="!isDisponible(v)"
          @click="reservar(v)"
        >
          {{ isDisponible(v) ? 'Reservar ahora →' : 'No disponible' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.catalogo {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.catalogo-header {
  text-align: center;
  margin-bottom: 3rem;
}

.catalogo-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.catalogo-header p { color: #888; }

.estado-msg {
  text-align: center;
  padding: 3rem;
  color: #888;
}

.estado-msg.error { color: #f87171; }

.vehiculos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.vehiculo-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  transition: transform 0.2s, border-color 0.2s;
}

.vehiculo-card:hover:not(.no-disponible) {
  transform: translateY(-4px);
  border-color: var(--primary, #f97316);
}

.no-disponible { opacity: 0.5; }

.card-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
}

.badge-ok { background: rgba(34,197,94,0.15); color: #22c55e; }
.badge-no { background: rgba(239,68,68,0.15); color: #f87171; }

.card-icono { font-size: 3rem; text-align: center; }

.card-info h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.placa {
  color: var(--primary, #f97316);
  font-weight: 600;
  font-size: 0.9rem;
  margin: 2px 0;
}

.card-detalles {
  display: flex;
  gap: 1rem;
  color: #888;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.btn-reservar {
  width: 100%;
  padding: 0.7rem;
  border-radius: 10px;
  border: none;
  background: var(--primary, #f97316);
  color: white;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
  margin-top: auto;
}

.btn-reservar:hover:not(:disabled) { opacity: 0.85; }
.btn-reservar:disabled {
  background: rgba(255,255,255,0.08);
  color: #555;
  cursor: not-allowed;
}
</style>
