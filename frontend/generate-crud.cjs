const fs = require('fs');
const path = require('path');

const views = [
  { name: 'Agencias', endpoint: '/Agencias' },
  { name: 'Auditorias', endpoint: '/Auditorias' },
  { name: 'Categorias', endpoint: '/Categorias' },
  { name: 'Ciudades', endpoint: '/Ciudades' },
  { name: 'Contratos', endpoint: '/Contratos' },
  { name: 'DetalleFactura', endpoint: '/DetalleFactura' },
  { name: 'Facturas', endpoint: '/Facturas' },
  { name: 'Kardex', endpoint: '/Kardex' },
  { name: 'Marcas', endpoint: '/Marcas' },
  { name: 'Modelos', endpoint: '/Modelos' },
  { name: 'Pagos', endpoint: '/Pagos' },
  { name: 'Personas', endpoint: '/Personas' },
  { name: 'Reservas', endpoint: '/Reservas' },
  { name: 'Siniestros', endpoint: '/Siniestros' },
  { name: 'Tarifas', endpoint: '/Tarifas' },
  { name: 'Usuarios', endpoint: '/Usuarios' },
  { name: 'VehiculosAdmin', endpoint: '/Vehiculos' } // Vehiculos admin panel
];

const template = (name, endpoint) => `<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const items = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchItems = async () => {
  try {
    const response = await api.get('${endpoint}');
    items.value = response.data;
  } catch (err) {
    if (err.response && err.response.status === 401) {
       error.value = 'No autorizado. Por favor inicie sesión como Administrador.';
    } else {
       error.value = 'Error al cargar los datos desde el servidor.';
    }
  } finally {
    loading.value = false;
  }
};

const openModal = (item = null) => {
  // Aquí puedes programar tu modal personalizado para ${name}.
  alert('Formulario temporal: Aquí se abrirá un popup para ' + (item ? 'editar el registro con ID ' + item[Object.keys(item)[0]] : 'crear un nuevo registro') + '. Puedes personalizar este HTML en src/views/admin/${name}.vue');
};

const deleteItem = async (item) => {
  if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
    const primaryKey = Object.keys(item)[0];
    const id = item[primaryKey];
    try {
      await api.delete(\`${endpoint}/\${id}\`);
      await fetchItems();
    } catch (err) {
      alert('Error al eliminar. Puede que tenga registros relacionados en otras tablas.');
    }
  }
};

onMounted(() => {
  fetchItems();
});
</script>

<template>
  <div class="crud-view">
    <div class="page-header" style="margin-bottom: 2rem;">
      <h1 class="page-title text-primary" style="font-size: 2.2rem; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase;">Módulo ${name}</h1>
      <p class="text-muted">Gestiona todos los registros de esta tabla en tu base de datos de manera directa y segura.</p>
    </div>

    <!-- Toolbar superior -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 2rem;">
      <button @click="openModal()" class="btn-primary" style="padding: 0.75rem 2rem; display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.25rem;">+</span> Nuevo Registro
      </button>
    </div>

    <!-- Data Panel -->
    <div class="glass-panel" style="padding: 0; overflow: hidden;">
      <div v-if="loading" style="padding: 4rem; text-align: center; color: var(--primary);">
        <h2 style="animation: pulse 1.5s infinite alternate;">⏳ Cargando tablas...</h2>
      </div>
      
      <div v-else-if="error" style="padding: 4rem; text-align: center;">
        <h3 class="text-danger">❌ {{ error }}</h3>
      </div>
      
      <div v-else-if="items.length > 0" style="overflow-x: auto;">
        <table class="crud-table">
          <thead>
            <tr>
              <th v-for="(val, key) in items[0]" :key="key">{{ key.replace('_', ' ') }}</th>
              <th style="width: 150px; text-align: center;">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="index">
              <td v-for="(val, key) in item" :key="key">
                <!-- Mostramos Checkboxes estilizados en vez de true/false feos -->
                <span v-if="typeof val === 'boolean'" class="status-chip" :class="val ? 'status-chip-success' : 'status-chip-danger'">
                  {{ val ? 'SI' : 'NO' }}
                </span>
                <span v-else>{{ val }}</span>
              </td>
              <td style="text-align: center; display: flex; justify-content: center; gap: 1rem;">
                <button class="action-btn text-primary" title="Editar" @click="openModal(item)">✏️</button>
                <button class="action-btn text-danger" title="Eliminar" @click="deleteItem(item)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-else style="padding: 4rem; text-align: center;">
        <h3 class="text-muted">La tabla está vacía</h3>
        <p style="margin-top: 1rem;">No se encontraron registros de ${name} en la base de datos.</p>
        <button @click="openModal()" class="btn-primary" style="margin-top: 2rem;">Crear el primer registro</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crud-view {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.crud-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-main);
  font-size: 0.95rem;
}

.crud-table th, .crud-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--glass-border);
  text-align: left;
}

.crud-table th {
  background: rgba(0, 0, 0, 0.4);
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.crud-table tbody tr {
  transition: background 0.2s ease;
}

.crud-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  transition: transform 0.2s ease, opacity 0.2s ease;
  opacity: 0.7;
}

.action-btn:hover {
  transform: scale(1.2);
  opacity: 1;
}

.status-chip {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 800;
}
.status-chip-success { background: rgba(30, 200, 100, 0.2); color: #4ade80; }
.status-chip-danger { background: rgba(250, 50, 50, 0.2); color: #f87171; }
</style>
`;

const dirPath = path.join(__dirname, 'src', 'views', 'admin');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

views.forEach(view => {
  const filePath = path.join(dirPath, `${view.name}.vue`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, template(view.name, view.endpoint));
    console.log(`Created ${view.name}.vue`);
  } else {
    console.log(`${view.name}.vue already exists, skipping to avoid overwrite.`);
  }
});

console.log('Finalizado la creación de plantillas Vue MVC');
