<script setup>
/**
 * BookingTest.vue — Panel de pruebas interactivo para el operaciones-service
 *
 * Cubre el flujo completo:
 *  1. ✅ Health Check
 *  2. 📋 Crear Reserva (PENDIENTE)
 *  3. ✅ Confirmar Reserva (→ CONFIRMADA)
 *  4. 🚗 Iniciar Alquiler (→ ACTIVA + vehículo EN_USO)
 *  5. 🏁 Registrar Devolución (→ COMPLETADA + vehículo DISPONIBLE)
 *  6. ❌ Cancelar Reserva (en cualquier estado válido)
 */
import { ref, reactive } from 'vue';
import BOOKING_API from '@/api/booking.api.js';

// ── Estado global del panel ───────────────────────────────────────────────────
const serviceOnline = ref(null);   // null=desconocido, true/false
const logs          = ref([]);     // historial de peticiones
const loading       = ref(false);

// IDs generados o pegados por el usuario durante las pruebas
const ids = reactive({ reserva: '', alquiler: '' });

// ── Formularios ───────────────────────────────────────────────────────────────
const formReserva = reactive({
  vehiculoId:  '',
  clienteId:   '',
  agenciaId:   '',
  fechaInicio: '',
  fechaFin:    '',
});

const formAlquiler = reactive({
  reservaId:    '',
  kmSalida:     0,
  observaciones: '',
});

const formDevolucion = reactive({
  alquilerId:    '',
  kmEntrada:     0,
  estadoVehiculo: 'BUENO',
  cargoExtra:    0,
  observaciones:  '',
});

const formEstado = reactive({ reservaId: '', status: 'CONFIRMADA' });

// ── Helpers ───────────────────────────────────────────────────────────────────
function addLog(tipo, titulo, data, error = false) {
  logs.value.unshift({
    id:     Date.now(),
    tipo,
    titulo,
    data:   JSON.stringify(data, null, 2),
    error,
    ts:     new Date().toLocaleTimeString(),
  });
}

function run(fn) {
  loading.value = true;
  return fn()
    .catch(err => {
      const errorData = err.response?.data ?? { message: err.message };
      addLog('ERROR', `❌ ${err.config?.url ?? 'Error'}`, errorData, true);
      throw err;
    })
    .finally(() => { loading.value = false; });
}

// ── Acciones ──────────────────────────────────────────────────────────────────

async function checkHealth() {
  await run(async () => {
    const data = await BOOKING_API.health();
    serviceOnline.value = data.status === 'ok';
    addLog('GET', '🟢 Health Check', data);
  });
}

async function crearReserva() {
  await run(async () => {
    const payload = { ...formReserva };
    if (!payload.agenciaId) delete payload.agenciaId;
    const data = await BOOKING_API.crearReserva(payload);
    ids.reserva          = data.id;
    formEstado.reservaId = data.id;
    formAlquiler.reservaId = data.id;
    addLog('POST', '📋 Reserva creada', data);
  });
}

async function cambiarEstado() {
  await run(async () => {
    const data = await BOOKING_API.cambiarEstadoReserva(formEstado.reservaId, formEstado.status);
    ids.reserva = data.id;
    addLog('PATCH', `🔄 Estado → ${formEstado.status}`, data);
  });
}

async function iniciarAlquiler() {
  await run(async () => {
    const data = await BOOKING_API.iniciarAlquiler({ ...formAlquiler });
    ids.alquiler               = data.id;
    formDevolucion.alquilerId  = data.id;
    addLog('POST', '🚗 Alquiler iniciado', data);
  });
}

async function registrarDevolucion() {
  await run(async () => {
    const data = await BOOKING_API.registrarDevolucion({ ...formDevolucion });
    addLog('POST', '🏁 Devolución registrada', data);
  });
}

function clearLogs() { logs.value = []; }
</script>

<template>
  <div class="booking-test">
    <!-- CABECERA -->
    <div class="page-header">
      <h1 class="page-title text-primary">🧪 Booking Test Lab</h1>
      <p class="text-muted">Panel de pruebas para el <code>operaciones-service</code> (puerto 3004)</p>
    </div>

    <!-- STATUS BAR -->
    <div class="status-bar glass-panel">
      <div class="status-item">
        <span class="status-dot" :class="serviceOnline === true ? 'dot-green' : serviceOnline === false ? 'dot-red' : 'dot-gray'"></span>
        <span>operaciones-service :3004</span>
        <span class="status-label" :class="serviceOnline === true ? 'label-green' : serviceOnline === false ? 'label-red' : 'label-gray'">
          {{ serviceOnline === true ? 'ONLINE' : serviceOnline === false ? 'OFFLINE' : 'Desconocido' }}
        </span>
      </div>
      <button class="btn-secondary" @click="checkHealth" :disabled="loading">
        {{ loading ? '...' : '🔍 Verificar servicio' }}
      </button>
    </div>

    <!-- ALERTA si servicio offline -->
    <div v-if="serviceOnline === false" class="alert-error glass-panel">
      ⚠️ El servicio no responde. Asegúrate de haber ejecutado:<br>
      <code>cd ProyectoRentaVehiculos/services/operaciones-service && npm run dev</code>
    </div>

    <div class="test-layout">
      <!-- PANEL IZQUIERDO: Formularios -->
      <div class="forms-col">

        <!-- ── PASO 1: CREAR RESERVA ── -->
        <div class="step-card glass-panel">
          <div class="step-header">
            <span class="step-badge">1</span>
            <span class="step-title">Crear Reserva</span>
            <span class="step-tag tag-blue">POST /reservas/booking</span>
          </div>
          <div class="form-grid">
            <div class="form-group full">
              <label>vehiculoId <span class="req">*</span></label>
              <input v-model="formReserva.vehiculoId" class="input-field" placeholder="UUID del vehículo (inventario-service)" />
            </div>
            <div class="form-group full">
              <label>clienteId <span class="req">*</span></label>
              <input v-model="formReserva.clienteId" class="input-field" placeholder="UUID del usuario/cliente" />
            </div>
            <div class="form-group full">
              <label>agenciaId</label>
              <input v-model="formReserva.agenciaId" class="input-field" placeholder="UUID de agencia (opcional)" />
            </div>
            <div class="form-group">
              <label>fechaInicio <span class="req">*</span></label>
              <input v-model="formReserva.fechaInicio" type="date" class="input-field" />
            </div>
            <div class="form-group">
              <label>fechaFin <span class="req">*</span></label>
              <input v-model="formReserva.fechaFin" type="date" class="input-field" />
            </div>
          </div>
          <button class="btn-primary step-btn" @click="crearReserva" :disabled="loading">
            📋 Crear Reserva (PENDIENTE)
          </button>
          <div v-if="ids.reserva" class="id-badge">
            ✅ ID generado: <code>{{ ids.reserva }}</code>
          </div>
        </div>

        <!-- ── PASO 2: CAMBIAR ESTADO ── -->
        <div class="step-card glass-panel">
          <div class="step-header">
            <span class="step-badge">2</span>
            <span class="step-title">Cambiar Estado Reserva</span>
            <span class="step-tag tag-yellow">PATCH /reservas/booking/:id</span>
          </div>
          <p class="step-help">Estado válido según la reserva actual. Flujo: <strong>PENDIENTE → CONFIRMADA → ACTIVA → COMPLETADA</strong></p>
          <div class="form-grid">
            <div class="form-group full">
              <label>reservaId <span class="req">*</span></label>
              <input v-model="formEstado.reservaId" class="input-field" placeholder="UUID de la reserva" />
            </div>
            <div class="form-group full">
              <label>Nuevo Estado</label>
              <select v-model="formEstado.status" class="input-field">
                <option value="CONFIRMADA">CONFIRMADA</option>
                <option value="ACTIVA">ACTIVA</option>
                <option value="COMPLETADA">COMPLETADA</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>
          </div>
          <button class="btn-primary step-btn" style="background: var(--warning, #eab308);" @click="cambiarEstado" :disabled="loading">
            🔄 Cambiar Estado
          </button>
        </div>

        <!-- ── PASO 3: INICIAR ALQUILER ── -->
        <div class="step-card glass-panel">
          <div class="step-header">
            <span class="step-badge">3</span>
            <span class="step-title">Iniciar Alquiler</span>
            <span class="step-tag tag-blue">POST /alquileres/booking</span>
          </div>
          <p class="step-help">La reserva debe estar en estado <strong>CONFIRMADA</strong> antes de iniciar el alquiler.</p>
          <div class="form-grid">
            <div class="form-group full">
              <label>reservaId <span class="req">*</span></label>
              <input v-model="formAlquiler.reservaId" class="input-field" placeholder="UUID de reserva CONFIRMADA" />
            </div>
            <div class="form-group">
              <label>kmSalida</label>
              <input v-model.number="formAlquiler.kmSalida" type="number" class="input-field" placeholder="Ej: 15000" />
            </div>
            <div class="form-group">
              <label>Observaciones</label>
              <input v-model="formAlquiler.observaciones" class="input-field" placeholder="Opcional..." />
            </div>
          </div>
          <button class="btn-primary step-btn" style="background: var(--success, #22c55e);" @click="iniciarAlquiler" :disabled="loading">
            🚗 Iniciar Alquiler (vehículo → EN_USO)
          </button>
          <div v-if="ids.alquiler" class="id-badge">
            ✅ Alquiler ID: <code>{{ ids.alquiler }}</code>
          </div>
        </div>

        <!-- ── PASO 4: DEVOLUCIÓN ── -->
        <div class="step-card glass-panel">
          <div class="step-header">
            <span class="step-badge">4</span>
            <span class="step-title">Registrar Devolución</span>
            <span class="step-tag tag-green">POST /devoluciones/booking</span>
          </div>
          <p class="step-help">El alquiler debe estar <strong>ACTIVO</strong>. El vehículo vuelve a <strong>DISPONIBLE</strong>.</p>
          <div class="form-grid">
            <div class="form-group full">
              <label>alquilerId <span class="req">*</span></label>
              <input v-model="formDevolucion.alquilerId" class="input-field" placeholder="UUID del alquiler" />
            </div>
            <div class="form-group">
              <label>kmEntrada</label>
              <input v-model.number="formDevolucion.kmEntrada" type="number" class="input-field" placeholder="Ej: 15340" />
            </div>
            <div class="form-group">
              <label>Estado del Vehículo</label>
              <select v-model="formDevolucion.estadoVehiculo" class="input-field">
                <option value="EXCELENTE">Excelente</option>
                <option value="BUENO">Bueno</option>
                <option value="REGULAR">Regular</option>
                <option value="DAÑADO">Dañado</option>
              </select>
            </div>
            <div class="form-group">
              <label>Cargo Extra ($)</label>
              <input v-model.number="formDevolucion.cargoExtra" type="number" step="0.01" class="input-field" placeholder="0.00" />
            </div>
            <div class="form-group full">
              <label>Observaciones</label>
              <input v-model="formDevolucion.observaciones" class="input-field" placeholder="Opcional..." />
            </div>
          </div>
          <button class="btn-primary step-btn" style="background: #8b5cf6;" @click="registrarDevolucion" :disabled="loading">
            🏁 Registrar Devolución
          </button>
        </div>

      </div>

      <!-- PANEL DERECHO: Log de respuestas -->
      <div class="logs-col">
        <div class="logs-header">
          <span class="logs-title">📡 Respuestas del Servidor</span>
          <button class="btn-secondary btn-sm" @click="clearLogs">🗑️ Limpiar</button>
        </div>

        <div v-if="logs.length === 0" class="logs-empty">
          <span>Sin peticiones aún.</span>
          <span>Empieza con el <strong>Health Check</strong> ↑</span>
        </div>

        <div v-for="log in logs" :key="log.id" class="log-entry" :class="{ 'log-error': log.error }">
          <div class="log-meta">
            <span class="log-method" :class="log.tipo === 'ERROR' ? 'method-red' : log.tipo === 'PATCH' ? 'method-yellow' : 'method-blue'">
              {{ log.tipo }}
            </span>
            <span class="log-title">{{ log.titulo }}</span>
            <span class="log-ts">{{ log.ts }}</span>
          </div>
          <pre class="log-body">{{ log.data }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.booking-test { animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

.page-header { margin-bottom: 1.5rem; }
.page-title { font-size: 2rem; font-weight: 800; margin-bottom: 0.4rem; text-transform: uppercase; }
code { background: rgba(255,255,255,0.08); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }

/* Status bar */
.status-bar { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.5rem; margin-bottom:1rem; }
.status-item { display:flex; align-items:center; gap:0.75rem; font-size:0.95rem; }
.status-dot  { width:10px; height:10px; border-radius:50%; }
.dot-green { background:#22c55e; box-shadow: 0 0 8px #22c55e; }
.dot-red   { background:#f87171; box-shadow: 0 0 8px #f87171; }
.dot-gray  { background:#6b7280; }
.status-label { font-size:0.75rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:9999px; }
.label-green { background:rgba(34,197,94,0.15); color:#22c55e; }
.label-red   { background:rgba(248,113,113,0.15); color:#f87171; }
.label-gray  { background:rgba(107,114,128,0.15); color:#9ca3af; }

.alert-error {
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.3);
  color: #fca5a5;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.8;
}

/* Layout */
.test-layout { display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
@media (max-width: 1100px) { .test-layout { grid-template-columns: 1fr; } }

/* Step cards */
.step-card { padding: 1.5rem; margin-bottom: 1rem; }
.step-header { display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; flex-wrap:wrap; }
.step-badge { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; background:var(--primary, #7c3aed); font-weight:900; font-size:0.85rem; }
.step-title { font-size:1rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; }
.step-tag { font-size:0.72rem; padding:0.2rem 0.6rem; border-radius:9999px; font-weight:700; font-family:monospace; }
.tag-blue   { background:rgba(59,130,246,0.2); color:#60a5fa; }
.tag-yellow { background:rgba(234,179,8,0.2);  color:#facc15; }
.tag-green  { background:rgba(34,197,94,0.2);  color:#4ade80; }
.step-help { font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem; line-height:1.5; }

.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem; }
.form-group { display:flex; flex-direction:column; gap:0.3rem; }
.form-group.full { grid-column: 1 / -1; }
label { font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); }
.req { color:#f87171; }

.step-btn { width:100%; padding:0.75rem; font-size:0.9rem; font-weight:700; }

.id-badge { margin-top:0.75rem; padding:0.5rem 0.75rem; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25); border-radius:8px; font-size:0.82rem; color:#4ade80; }
.id-badge code { background:rgba(34,197,94,0.15); color:#86efac; }

/* Buttons */
.btn-secondary { background:rgba(255,255,255,0.07); border:1px solid var(--glass-border); color:var(--text-main); padding:0.5rem 1rem; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem; transition:background 0.2s; }
.btn-secondary:hover { background:rgba(255,255,255,0.12); }
.btn-sm { padding:0.3rem 0.75rem; font-size:0.8rem; }

/* Logs panel */
.logs-col { position:sticky; top:1.5rem; }
.logs-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.logs-title { font-size:1rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; }

.logs-empty { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:3rem; color:var(--text-muted); font-size:0.9rem; text-align:center; border:2px dashed var(--glass-border); border-radius:12px; }

.log-entry { background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:10px; margin-bottom:0.75rem; overflow:hidden; }
.log-entry.log-error { border-color:rgba(248,113,113,0.35); background:rgba(248,113,113,0.05); }

.log-meta { display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.75rem; border-bottom:1px solid var(--glass-border); flex-wrap:wrap; }
.log-method { font-size:0.7rem; font-weight:900; padding:0.15rem 0.5rem; border-radius:4px; font-family:monospace; }
.method-blue   { background:rgba(59,130,246,0.2); color:#60a5fa; }
.method-yellow { background:rgba(234,179,8,0.2);  color:#facc15; }
.method-red    { background:rgba(248,113,113,0.2); color:#f87171; }
.log-title { font-size:0.85rem; font-weight:700; flex:1; }
.log-ts { font-size:0.72rem; color:var(--text-muted); }

.log-body {
  padding: 0.75rem;
  font-size: 0.78rem;
  font-family: monospace;
  color: #a5f3fc;
  overflow-x: auto;
  max-height: 250px;
  overflow-y: auto;
  margin: 0;
  background: rgba(0,0,0,0.2);
  white-space: pre;
}
.log-entry.log-error .log-body { color: #fca5a5; }
.log-body::-webkit-scrollbar { width:4px; height:4px; }
.log-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
</style>
