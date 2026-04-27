<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import CrudModal from '../../components/CrudModal.vue';

const items = ref([]);
const loading = ref(true);
const error = ref(null);
const showModal = ref(false);
const modalMode = ref('create');
const selectedItem = ref(null);

const PK = 'ID_Vehiculo';
const ENDPOINT = '/Vehiculos';
const MODULE_NAME = 'Vehículo';

const fields = [
  { key: 'ID_Vehiculo',        label: 'ID Vehículo',    type: 'number',  readOnly: true },
  { key: 'ID_Modelo',          label: 'ID Modelo',      type: 'number',  required: true },
  { key: 'ID_Categoria',       label: 'ID Categoría',   type: 'number',  required: true },
  { key: 'ID_Agencia_Actual',  label: 'ID Agencia',     type: 'number',  required: true },
  { key: 'Placa_Vehiculo',     label: 'Placa',          type: 'text',    required: true },
  { key: 'Color_Vehiculo',     label: 'Color',          type: 'text',    required: true },
  { key: 'Anio_Vehiculo',      label: 'Año',            type: 'number',  required: true, min: 1990, max: 2030 },
  { key: 'Kilometraje_Vehiculo', label: 'Kilometraje',  type: 'decimal', required: true },
  { key: 'Combustible_Vehiculo', label: 'Combustible',  type: 'select',  required: true,
    options: [
      { value: 'Gasolina', label: 'Gasolina' },
      { value: 'Diésel',   label: 'Diésel' },
      { value: 'Híbrido',  label: 'Híbrido' },
      { value: 'Eléctrico',label: 'Eléctrico' },
    ]
  },
  { key: 'Estado_Vehiculo',    label: 'Estado',         type: 'select',  required: true,
    options: [
      { value: 'Disponible',    label: 'Disponible' },
      { value: 'Alquilado',     label: 'Alquilado' },
      { value: 'Mantenimiento', label: 'En Mantenimiento' },
      { value: 'Inactivo',      label: 'Inactivo' },
    ]
  },
  { key: 'Fecha_Registro',     label: 'Fecha Registro', type: 'date',    readOnly: true },
];

const fetchItems = async () => {
  loading.value = true; error.value = null;
  try {
    const res = await api.get(ENDPOINT);
    items.value = res.data;
  } catch (err) {
    error.value = err.response?.status === 401
      ? 'No autorizado. Por favor inicie sesión como Administrador.'
      : 'Error al cargar los datos desde el servidor.';
  } finally { loading.value = false; }
};

const openCreate = () => { modalMode.value = 'create'; selectedItem.value = null; showModal.value = true; };
const openEdit   = (item) => { modalMode.value = 'edit'; selectedItem.value = { ...item }; showModal.value = true; };
const openView   = (item) => { modalMode.value = 'view'; selectedItem.value = { ...item }; showModal.value = true; };

const deleteItem = async (item) => {
  if (!confirm(`¿Eliminar ${MODULE_NAME} ${item['Placa_Vehiculo']} (ID ${item[PK]})?`)) return;
  try { await api.delete(`${ENDPOINT}/${item[PK]}`); await fetchItems(); }
  catch { alert('Error al eliminar. Puede tener registros relacionados.'); }
};

// Columnas visibles en la tabla (no mostrar todas para no saturar)
const tableFields = ['ID_Vehiculo', 'Placa_Vehiculo', 'Color_Vehiculo', 'Anio_Vehiculo', 'Combustible_Vehiculo', 'Estado_Vehiculo'];

onMounted(fetchItems);
</script>

<template>
  <div class="crud-view">
    <div class="page-header">
      <h1 class="page-title text-primary">Módulo Vehículos</h1>
      <p class="text-muted">Gestiona el inventario completo de vehículos.</p>
    </div>
    <div style="display:flex; justify-content:flex-end; margin-bottom:2rem;">
      <button @click="openCreate" class="btn-primary" style="padding:0.75rem 2rem; display:flex; align-items:center; gap:0.5rem;">
        <span style="font-size:1.25rem;">+</span> Nuevo Vehículo
      </button>
    </div>
    <div class="glass-panel" style="padding:0; overflow:hidden;">
      <div v-if="loading" style="padding:4rem; text-align:center; color:var(--primary);"><h2>⏳ Cargando...</h2></div>
      <div v-else-if="error" style="padding:4rem; text-align:center;"><h3 class="text-danger">❌ {{ error }}</h3></div>
      <div v-else-if="items.length > 0" style="overflow-x:auto;">
        <table class="crud-table">
          <thead><tr>
            <th v-for="key in tableFields" :key="key">{{ key.replace(/_/g,' ').replace('Vehiculo','') }}</th>
            <th style="width:160px; text-align:center;">ACCIONES</th>
          </tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item[PK]">
              <td v-for="key in tableFields" :key="key">
                <span v-if="key === 'Estado_Vehiculo'" class="status-chip" :class="{
                  'chip-green': item[key] === 'Disponible',
                  'chip-yellow': item[key] === 'Alquilado',
                  'chip-red': item[key] === 'Mantenimiento' || item[key] === 'Inactivo',
                }">{{ item[key] }}</span>
                <span v-else>{{ item[key] }}</span>
              </td>
              <td style="text-align:center;"><div style="display:flex; justify-content:center; gap:0.5rem;">
                <button class="action-btn" title="Ver detalles" @click="openView(item)">👁️</button>
                <button class="action-btn text-primary" title="Editar" @click="openEdit(item)">✏️</button>
                <button class="action-btn text-danger" title="Eliminar" @click="deleteItem(item)">🗑️</button>
              </div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else style="padding:4rem; text-align:center;">
        <h3 class="text-muted">La tabla está vacía</h3>
        <button @click="openCreate" class="btn-primary" style="margin-top:2rem;">Registrar primer vehículo</button>
      </div>
    </div>
    <CrudModal v-model="showModal" :mode="modalMode" :fields="fields" :item="selectedItem" :primary-key="PK" :endpoint="ENDPOINT" :module-name="MODULE_NAME" @saved="fetchItems" />
  </div>
</template>

<style scoped>
.crud-view { animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.page-header { margin-bottom: 2rem; }
.page-title { font-size:2.2rem; font-weight:800; margin-bottom:0.5rem; text-transform:uppercase; }
.crud-table { width:100%; border-collapse:collapse; color:var(--text-main); font-size:0.95rem; }
.crud-table th, .crud-table td { padding:1.25rem 1.5rem; border-bottom:1px solid var(--glass-border); text-align:left; }
.crud-table th { background:rgba(0,0,0,0.4); font-weight:800; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px; color:var(--text-muted); }
.crud-table tbody tr { transition:background 0.2s ease; }
.crud-table tbody tr:hover { background:rgba(255,255,255,0.03); }
.action-btn { background:none; border:none; cursor:pointer; font-size:1.15rem; padding:0.25rem 0.4rem; transition:transform 0.2s, opacity 0.2s; opacity:0.7; border-radius:6px; }
.action-btn:hover { transform:scale(1.2); opacity:1; }
.status-chip { padding:0.2rem 0.65rem; border-radius:9999px; font-size:0.75rem; font-weight:700; text-transform:capitalize; }
.chip-green  { background:rgba(30,200,100,0.2); color:#4ade80; }
.chip-yellow { background:rgba(250,200,30,0.2); color:#facc15; }
.chip-red    { background:rgba(250,50,50,0.2);  color:#f87171; }
</style>
