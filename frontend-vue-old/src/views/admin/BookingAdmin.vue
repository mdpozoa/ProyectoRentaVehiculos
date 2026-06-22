<script setup>
/**
 * BookingAdmin.vue — Administración de vehículos en el catálogo de Booking
 *
 * Conecta directo al inventario-service (Azure) para:
 *  - Listar todos los vehículos del catálogo público de reservas
 *  - Ver detalles de cada vehículo
 *  - Cambiar el estado (DISPONIBLE, RESERVADO, EN_USO, MANTENIMIENTO, INACTIVO)
 *  - Eliminar un vehículo del catálogo
 *
 * NO toca ningún backend de operaciones ni booking.routes.ts
 */
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

// ── Instancia HTTP hacia el inventario-service (via Nginx/Azure Gateway) ───────
const inventarioHttp = axios.create({
  baseURL: '/api/v1',          // En producción (Azure), el nginx resuelve esto
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar JWT automáticamente
inventarioHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Estado ────────────────────────────────────────────────────────────────────
const vehicles     = ref([]);
const loading      = ref(true);
const error        = ref(null);
const searchQuery  = ref('');
const statusFilter = ref('');

// Modal de detalle/edición
const showModal    = ref(false);
const modalVehicle = ref(null);
const saving       = ref(false);
const saveError    = ref(null);
const newStatus    = ref('');

// Modal de confirmación de eliminación
const showDeleteModal  = ref(false);
const deletingVehicle  = ref(null);
const deleting         = ref(false);

// ── Opciones de estado ────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'DISPONIBLE',   label: 'Disponible',    color: 'chip-green'  },
  { value: 'RESERVADO',    label: 'Reservado',     color: 'chip-yellow' },
  { value: 'EN_USO',       label: 'En Uso',        color: 'chip-blue'   },
  { value: 'MANTENIMIENTO',label: 'Mantenimiento', color: 'chip-orange' },
  { value: 'INACTIVO',     label: 'Inactivo',      color: 'chip-red'    },
];

function getStatusInfo(status) {
  return STATUS_OPTIONS.find(s => s.value === status) ?? { label: status, color: 'chip-gray' };
}

// ── Carga de vehículos ────────────────────────────────────────────────────────
async function fetchVehicles() {
  loading.value = true;
  error.value   = null;
  try {
    const res = await inventarioHttp.get('/vehiculos/booking');
    // La ruta pública devuelve { success, data: [...] } o directamente un array
    vehicles.value = Array.isArray(res.data)
      ? res.data
      : (res.data?.data ?? []);
  } catch (err) {
    error.value = err.response?.data?.error?.message
      ?? err.response?.data?.message
      ?? 'No se pudo cargar el catálogo de vehículos.';
  } finally {
    loading.value = false;
  }
}

// ── Filtros ───────────────────────────────────────────────────────────────────
const filteredVehicles = computed(() => {
  let list = vehicles.value;

  if (statusFilter.value) {
    list = list.filter(v => v.status === statusFilter.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(v =>
      v.placa?.toLowerCase().includes(q)        ||
      v.marca?.toLowerCase().includes(q)        ||
      v.modelo?.toLowerCase().includes(q)       ||
      v.color?.toLowerCase().includes(q)
    );
  }

  return list;
});

const stats = computed(() => ({
  total:        vehicles.value.length,
  disponibles:  vehicles.value.filter(v => v.status === 'DISPONIBLE').length,
  reservados:   vehicles.value.filter(v => v.status === 'RESERVADO').length,
  enUso:        vehicles.value.filter(v => v.status === 'EN_USO').length,
  mantenimiento:vehicles.value.filter(v => v.status === 'MANTENIMIENTO').length,
}));

// ── Modal: editar estado ──────────────────────────────────────────────────────
function openEditModal(vehicle) {
  modalVehicle.value = vehicle;
  newStatus.value    = vehicle.status;
  saveError.value    = null;
  showModal.value    = true;
}

function closeModal() {
  showModal.value    = false;
  modalVehicle.value = null;
  saveError.value    = null;
}

async function saveStatus() {
  if (!modalVehicle.value || !newStatus.value) return;
  saving.value    = true;
  saveError.value = null;
  try {
    await inventarioHttp.patch(`/vehiculos/${modalVehicle.value.id}`, {
      status: newStatus.value,
    });
    // Actualizar localmente sin recargar todo
    const idx = vehicles.value.findIndex(v => v.id === modalVehicle.value.id);
    if (idx !== -1) vehicles.value[idx] = { ...vehicles.value[idx], status: newStatus.value };
    closeModal();
  } catch (err) {
    saveError.value = err.response?.data?.error?.message
      ?? err.response?.data?.message
      ?? 'Error al actualizar el estado. Verifica tu sesión.';
  } finally {
    saving.value = false;
  }
}

// ── Modal: eliminar vehículo ──────────────────────────────────────────────────
function openDeleteModal(vehicle) {
  deletingVehicle.value = vehicle;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  deletingVehicle.value = null;
}

async function confirmDelete() {
  if (!deletingVehicle.value) return;
  deleting.value = true;
  try {
    await inventarioHttp.delete(`/vehiculos/${deletingVehicle.value.id}`);
    vehicles.value = vehicles.value.filter(v => v.id !== deletingVehicle.value.id);
    closeDeleteModal();
  } catch (err) {
    alert(err.response?.data?.error?.message ?? 'Error al eliminar el vehículo.');
  } finally {
    deleting.value = false;
  }
}

// ── Inicialización ────────────────────────────────────────────────────────────
onMounted(fetchVehicles);
</script>

<template>
  <div class="booking-admin">

    <!-- CABECERA -->
    <div class="page-header">
      <div>
        <h1 class="page-title text-primary">🚗 Gestión de Booking</h1>
        <p class="text-muted">Administra los vehículos disponibles en el catálogo de reservas públicas.</p>
      </div>
      <button class="btn-refresh" @click="fetchVehicles" :disabled="loading" title="Recargar">
        <span :class="{ spinning: loading }">🔄</span> Recargar
      </button>
    </div>

    <!-- KPI CARDS -->
    <div class="stats-grid" v-if="!loading && !error">
      <div class="stat-card glass-panel">
        <div class="stat-icon">🚘</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.total }}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>
      <div class="stat-card glass-panel stat-green">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.disponibles }}</span>
          <span class="stat-label">Disponibles</span>
        </div>
      </div>
      <div class="stat-card glass-panel stat-yellow">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.reservados }}</span>
          <span class="stat-label">Reservados</span>
        </div>
      </div>
      <div class="stat-card glass-panel stat-blue">
        <div class="stat-icon">🔑</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.enUso }}</span>
          <span class="stat-label">En Uso</span>
        </div>
      </div>
      <div class="stat-card glass-panel stat-orange">
        <div class="stat-icon">🔧</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.mantenimiento }}</span>
          <span class="stat-label">Mantenimiento</span>
        </div>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="filters-bar glass-panel" v-if="!loading && !error">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Buscar por placa, marca, modelo o color..."
          id="booking-search"
        />
        <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">✕</button>
      </div>
      <div class="filter-wrap">
        <label class="filter-label">Estado:</label>
        <select v-model="statusFilter" class="filter-select" id="booking-status-filter">
          <option value="">Todos</option>
          <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <span class="results-count">{{ filteredVehicles.length }} vehículo(s)</span>
    </div>

    <!-- ESTADO: CARGANDO -->
    <div v-if="loading" class="state-box glass-panel">
      <div class="loader-ring"></div>
      <p>Cargando catálogo de vehículos...</p>
    </div>

    <!-- ESTADO: ERROR -->
    <div v-else-if="error" class="state-box state-error glass-panel">
      <span class="state-icon">❌</span>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="fetchVehicles">Reintentar</button>
    </div>

    <!-- ESTADO: VACÍO -->
    <div v-else-if="filteredVehicles.length === 0" class="state-box glass-panel">
      <span class="state-icon">🚫</span>
      <p v-if="searchQuery || statusFilter">No se encontraron vehículos con ese criterio.</p>
      <p v-else>No hay vehículos registrados en el catálogo de booking.</p>
      <button v-if="searchQuery || statusFilter" class="btn-outline-sm" @click="searchQuery = ''; statusFilter = ''">
        Limpiar filtros
      </button>
    </div>

    <!-- TABLA -->
    <div v-else class="glass-panel table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Vehículo</th>
            <th>Placa</th>
            <th>Color / Año</th>
            <th>Combustible</th>
            <th>Precio/día</th>
            <th>Estado</th>
            <th style="text-align:center; width:120px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in filteredVehicles" :key="v.id" class="data-row">
            <!-- Vehículo -->
            <td>
              <div class="vehicle-cell">
                <div class="vehicle-img" :style="v.foto ? `background-image:url(${v.foto.replace('/vehiculos/', '/fotos_vehiculos/')})` : ''">
                  <span v-if="!v.foto">🚙</span>
                </div>
                <div class="vehicle-info">
                  <span class="vehicle-name">{{ v.marca }} {{ v.modelo }}</span>
                  <span class="vehicle-id">{{ v.id?.slice(0, 8) }}...</span>
                </div>
              </div>
            </td>
            <!-- Placa -->
            <td><code class="placa-badge">{{ v.placa ?? '—' }}</code></td>
            <!-- Color / Año -->
            <td>
              <div class="sub-col">
                <span>{{ v.color ?? '—' }}</span>
                <span class="text-muted" style="font-size:0.8rem;">{{ v.anio ?? '' }}</span>
              </div>
            </td>
            <!-- Combustible -->
            <td>{{ v.combustible ?? v.tipoCombustible ?? '—' }}</td>
            <!-- Precio -->
            <td>
              <span class="precio" v-if="v.precioPorDia">
                ${{ Number(v.precioPorDia).toFixed(2) }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <!-- Estado -->
            <td>
              <span class="status-chip" :class="getStatusInfo(v.status).color">
                {{ getStatusInfo(v.status).label }}
              </span>
            </td>
            <!-- Acciones -->
            <td>
              <div class="actions-cell">
                <button
                  class="action-btn btn-edit"
                  title="Cambiar estado"
                  @click="openEditModal(v)"
                  :id="`edit-vehicle-${v.id?.slice(0,8)}`"
                >
                  ✏️
                </button>
                <button
                  class="action-btn btn-delete"
                  title="Eliminar del catálogo"
                  @click="openDeleteModal(v)"
                  :id="`delete-vehicle-${v.id?.slice(0,8)}`"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ════════════════════════════════════════════════════
         MODAL: EDITAR ESTADO
    ════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card glass-panel" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="modal-header">
            <h3 class="modal-title">✏️ Cambiar Estado del Vehículo</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <!-- Detalle del vehículo -->
          <div class="vehicle-detail-card" v-if="modalVehicle">
            <div class="detail-thumb">🚙</div>
            <div class="detail-info">
              <strong>{{ modalVehicle.marca }} {{ modalVehicle.modelo }}</strong>
              <span class="text-muted" style="font-size:0.82rem;">Placa: {{ modalVehicle.placa ?? '—' }}</span>
              <span class="status-chip mt-xs" :class="getStatusInfo(modalVehicle.status).color">
                {{ getStatusInfo(modalVehicle.status).label }}
              </span>
            </div>
          </div>

          <!-- Selector de nuevo estado -->
          <div class="modal-body">
            <label class="field-label">Nuevo Estado <span class="req">*</span></label>
            <div class="status-grid">
              <button
                v-for="opt in STATUS_OPTIONS"
                :key="opt.value"
                class="status-option"
                :class="[opt.color, { selected: newStatus === opt.value }]"
                @click="newStatus = opt.value"
                :id="`status-option-${opt.value.toLowerCase()}`"
              >
                <span class="opt-label">{{ opt.label }}</span>
                <span class="opt-check" v-if="newStatus === opt.value">✓</span>
              </button>
            </div>

            <div v-if="saveError" class="alert-error-inline">
              ⚠️ {{ saveError }}
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal" :disabled="saving">Cancelar</button>
            <button
              class="btn-primary save-btn"
              @click="saveStatus"
              :disabled="saving || newStatus === modalVehicle?.status"
              id="btn-save-status"
            >
              <span v-if="saving" class="btn-spinner"></span>
              {{ saving ? 'Guardando...' : 'Guardar Cambio' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ════════════════════════════════════════════════════
         MODAL: CONFIRMAR ELIMINACIÓN
    ════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-card modal-sm glass-panel" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3 class="modal-title" style="color:#f87171;">🗑️ Eliminar Vehículo</h3>
            <button class="modal-close" @click="closeDeleteModal">✕</button>
          </div>
          <div class="modal-body" style="text-align:center; padding: 2rem 1.5rem;">
            <div style="font-size:3rem; margin-bottom:1rem;">⚠️</div>
            <p style="margin-bottom:0.5rem;">¿Estás seguro de que deseas eliminar este vehículo del catálogo?</p>
            <p style="font-size:0.82rem; color:var(--text-muted);">
              <strong>{{ deletingVehicle?.marca }} {{ deletingVehicle?.modelo }}</strong>
              — Placa: {{ deletingVehicle?.placa ?? '—' }}
            </p>
            <p style="font-size:0.78rem; color:#f87171; margin-top:0.75rem;">Esta acción no se puede deshacer.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeDeleteModal" :disabled="deleting">Cancelar</button>
            <button class="btn-delete-confirm" @click="confirmDelete" :disabled="deleting" id="btn-confirm-delete">
              <span v-if="deleting" class="btn-spinner"></span>
              {{ deleting ? 'Eliminando...' : 'Sí, Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Layout base ─────────────────────────────────────────────────── */
.booking-admin { animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-title { font-size: 2rem; font-weight: 900; margin-bottom: 0.3rem; text-transform: uppercase; }

/* ── KPI Cards ───────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  padding: 1.25rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  border-radius: var(--radius-md);
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-3px); }
.stat-icon { font-size: 1.6rem; }
.stat-number { font-size: 1.7rem; font-weight: 900; display: block; line-height: 1; }
.stat-label  { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-green  { border-left: 3px solid #22c55e; }
.stat-yellow { border-left: 3px solid #facc15; }
.stat-blue   { border-left: 3px solid #60a5fa; }
.stat-orange { border-left: 3px solid #fb923c; }

/* ── Filtros ─────────────────────────────────────────────────────── */
.filters-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.search-wrap {
  flex: 1;
  min-width: 200px;
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon { position: absolute; left: 0.75rem; color: var(--text-muted); pointer-events: none; }
.search-input {
  width: 100%;
  padding: 0.6rem 2.2rem 0.6rem 2.2rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 0.9rem;
  outline: none;
  transition: border 0.2s;
}
.search-input:focus { border-color: var(--primary); }
.clear-search {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
}
.filter-wrap { display: flex; align-items: center; gap: 0.5rem; }
.filter-label { font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
.filter-select {
  padding: 0.5rem 0.8rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 0.88rem;
  outline: none;
  cursor: pointer;
}
.results-count { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; }

/* ── Botón recargar ──────────────────────────────────────────────── */
.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.2rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-refresh:hover { background: rgba(255,255,255,0.12); }
.btn-refresh:disabled { opacity: 0.5; cursor: default; }
.spinning { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── States (loading / error / empty) ───────────────────────────── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted);
  min-height: 240px;
}
.state-error { border: 1px solid rgba(248,113,113,0.3); background: rgba(248,113,113,0.06); color: #fca5a5; }
.state-icon { font-size: 2.5rem; }

/* Loader ring */
.loader-ring {
  width: 44px; height: 44px;
  border: 4px solid rgba(99,102,241,0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Tabla ───────────────────────────────────────────────────────── */
.table-wrap { padding: 0; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; color: var(--text-main); }
.data-table th, .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--glass-border); text-align: left; }
.data-table th { background: rgba(0,0,0,0.35); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); }
.data-row { transition: background 0.15s; }
.data-row:hover { background: rgba(255,255,255,0.03); }
.data-row:last-child td { border-bottom: none; }

/* Vehicle cell */
.vehicle-cell { display: flex; align-items: center; gap: 0.75rem; }
.vehicle-img {
  width: 42px; height: 42px;
  border-radius: 10px;
  background: rgba(99,102,241,0.15);
  background-size: cover;
  background-position: center;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}
.vehicle-info { display: flex; flex-direction: column; }
.vehicle-name { font-weight: 700; font-size: 0.92rem; }
.vehicle-id { font-size: 0.72rem; color: var(--text-muted); font-family: monospace; }

.placa-badge {
  background: rgba(99,102,241,0.15);
  color: var(--primary);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-family: monospace;
  letter-spacing: 1px;
}
.precio { font-weight: 700; color: #4ade80; }

.sub-col { display: flex; flex-direction: column; }

/* Status chips */
.status-chip { padding: 0.2rem 0.7rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
.chip-green  { background: rgba(34,197,94,0.15);  color: #4ade80; }
.chip-yellow { background: rgba(250,204,21,0.15); color: #facc15; }
.chip-blue   { background: rgba(96,165,250,0.15); color: #60a5fa; }
.chip-orange { background: rgba(251,146,60,0.15); color: #fb923c; }
.chip-red    { background: rgba(248,113,113,0.15);color: #f87171; }
.chip-gray   { background: rgba(156,163,175,0.15);color: #9ca3af; }

/* Actions */
.actions-cell { display: flex; justify-content: center; gap: 0.4rem; }
.action-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.3rem 0.4rem; border-radius: 6px; transition: transform 0.15s, background 0.15s; }
.action-btn:hover { transform: scale(1.2); }
.btn-edit:hover   { background: rgba(99,102,241,0.15); }
.btn-delete:hover { background: rgba(248,113,113,0.15); }

/* ── Modal base ──────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
  padding: 1rem;
}
.modal-card {
  width: 100%;
  max-width: 480px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  animation: modalIn 0.25s ease;
}
.modal-sm { max-width: 400px; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.94) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--glass-border);
}
.modal-title { font-size: 1.05rem; font-weight: 800; }
.modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; transition: color 0.2s; }
.modal-close:hover { color: var(--text-main); }

.modal-body { padding: 1.5rem; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--glass-border);
}

/* Vehicle detail inside modal */
.vehicle-detail-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid var(--glass-border);
}
.detail-thumb { font-size: 2.5rem; }
.detail-info { display: flex; flex-direction: column; gap: 0.25rem; }
.mt-xs { margin-top: 0.35rem; }

/* Status grid selector */
.field-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); display: block; margin-bottom: 0.75rem; }
.req { color: #f87171; }

.status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1rem; }
.status-option {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 700;
  transition: all 0.15s;
  opacity: 0.65;
}
.status-option:hover { opacity: 0.9; transform: translateY(-1px); }
.status-option.selected { border-color: currentColor; opacity: 1; }
.opt-check { font-size: 0.9rem; }

/* Inline error */
.alert-error-inline {
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.3);
  color: #fca5a5;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

/* Buttons inside modal */
.btn-cancel {
  padding: 0.6rem 1.4rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-main);
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-cancel:hover { background: rgba(255,255,255,0.12); }
.save-btn {
  padding: 0.6rem 1.6rem;
  border-radius: 8px;
  font-weight: 700;
  display: flex; align-items: center; gap: 0.5rem;
}
.save-btn:disabled { opacity: 0.5; cursor: default; }
.btn-delete-confirm {
  padding: 0.6rem 1.4rem;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; gap: 0.5rem;
  transition: background 0.2s;
}
.btn-delete-confirm:hover { background: #dc2626; }
.btn-delete-confirm:disabled { opacity: 0.5; cursor: default; }
.btn-outline-sm {
  padding: 0.5rem 1.2rem;
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  transition: border-color 0.2s, color 0.2s;
}
.btn-outline-sm:hover { border-color: var(--primary); color: var(--primary); }

/* Spinner inside button */
.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

.text-muted { color: var(--text-muted); }
</style>
