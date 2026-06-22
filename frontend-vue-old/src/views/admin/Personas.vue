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

const PK = 'ID_Persona';
const ENDPOINT = '/Personas';
const MODULE_NAME = 'Persona';

const fields = [
  { key: 'ID_Persona',          label: 'ID Persona',       type: 'number', readOnly: true },
  { key: 'ID_Ciudad',           label: 'ID Ciudad',        type: 'number', required: true },
  { key: 'Cedula_Persona',      label: 'Cédula / DNI',     type: 'text',   required: true },
  { key: 'Nombre_Persona',      label: 'Nombres',          type: 'text',   required: true },
  { key: 'Apellido_Persona',    label: 'Apellidos',        type: 'text',   required: true },
  { key: 'F_Nacimiento_Persona',label: 'Fecha Nacimiento', type: 'date',   required: true },
  { key: 'Telefono_Persona',    label: 'Teléfono',         type: 'text',   required: true },
  { key: 'Correo_Persona',      label: 'Correo',           type: 'email',  required: true },
  { key: 'Direccion_Persona',   label: 'Dirección',        type: 'text',   required: true, fullWidth: true },
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
  if (!confirm(`¿Eliminar ${MODULE_NAME} con ID ${item[PK]}?`)) return;
  try { await api.delete(`${ENDPOINT}/${item[PK]}`); await fetchItems(); }
  catch { alert('Error al eliminar. Puede tener registros relacionados.'); }
};

onMounted(fetchItems);
</script>

<template>
  <div class="crud-view">
    <div class="page-header">
      <h1 class="page-title text-primary">Módulo Personas</h1>
      <p class="text-muted">Gestiona los datos personales registrados en el sistema.</p>
    </div>
    <div style="display:flex; justify-content:flex-end; margin-bottom:2rem;">
      <button @click="openCreate" class="btn-primary" style="padding:0.75rem 2rem; display:flex; align-items:center; gap:0.5rem;">
        <span style="font-size:1.25rem;">+</span> Nueva Persona
      </button>
    </div>
    <div class="glass-panel" style="padding:0; overflow:hidden;">
      <div v-if="loading" style="padding:4rem; text-align:center; color:var(--primary);"><h2>⏳ Cargando...</h2></div>
      <div v-else-if="error" style="padding:4rem; text-align:center;"><h3 class="text-danger">❌ {{ error }}</h3></div>
      <div v-else-if="items.length > 0" style="overflow-x:auto;">
        <table class="crud-table">
          <thead><tr>
            <th v-for="f in fields" :key="f.key">{{ f.label }}</th>
            <th style="width:160px; text-align:center;">ACCIONES</th>
          </tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item[PK]">
              <td v-for="f in fields" :key="f.key">{{ item[f.key] }}</td>
              <td style="text-align:center;"><div style="display:flex; justify-content:center; gap:0.5rem;">
                <button class="action-btn" title="Ver" @click="openView(item)">👁️</button>
                <button class="action-btn text-primary" title="Editar" @click="openEdit(item)">✏️</button>
                <button class="action-btn text-danger" title="Eliminar" @click="deleteItem(item)">🗑️</button>
              </div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else style="padding:4rem; text-align:center;">
        <h3 class="text-muted">La tabla está vacía</h3>
        <button @click="openCreate" class="btn-primary" style="margin-top:2rem;">Crear primer registro</button>
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
</style>
