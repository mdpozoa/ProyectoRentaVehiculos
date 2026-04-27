<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();
const vehiculos = ref([]);
const cargando = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const res = await api.get('/Vehiculos');
    vehiculos.value = res.data;
  } catch {
    error.value = 'No se pudieron cargar los vehículos.';
  } finally {
    cargando.value = false;
  }
});

const reservar = (vehiculo) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    // Guardar el vehículo elegido y redirigir al login
    localStorage.setItem('vehiculo_pendiente', JSON.stringify(vehiculo));
    router.push('/login');
    return;
  }
  // Ya está logueado, ir directo a reservar
  router.push({ name: 'reservar', params: { id: vehiculo.ID_Vehiculo } });
};

const combustibleIcon = (tipo) => {
  const iconos = { Gasolina: '⛽', Diésel: '🛢️', Eléctrico: '⚡', Híbrido: '🔋' };
  return iconos[tipo] || '⛽';
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

    <div v-else class="vehiculos-grid">
      <div
        v-for="v in vehiculos"
        :key="v.ID_Vehiculo"
        class="vehiculo-card"
        :class="{ 'no-disponible': v.Estado_Vehiculo !== 'Disponible' }"
      >
        <div class="card-badge" :class="v.Estado_Vehiculo === 'Disponible' ? 'badge-ok' : 'badge-no'">
          {{ v.Estado_Vehiculo }}
        </div>

        <div class="card-icono">🚗</div>

        <div class="card-info">
          <h3>{{ v.Color_Vehiculo }} · {{ v.Anio_Vehiculo }}</h3>
          <p class="placa">{{ v.Placa_Vehiculo }}</p>

          <div class="card-detalles">
            <span>{{ combustibleIcon(v.Combustible_Vehiculo) }} {{ v.Combustible_Vehiculo }}</span>
            <span>📍 {{ v.Kilometraje_Vehiculo?.toLocaleString() }} km</span>
          </div>
        </div>

        <button
          class="btn-reservar"
          :disabled="v.Estado_Vehiculo !== 'Disponible'"
          @click="reservar(v)"
        >
          {{ v.Estado_Vehiculo === 'Disponible' ? 'Reservar ahora →' : 'No disponible' }}
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