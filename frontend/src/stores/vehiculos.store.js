/**
 * src/stores/vehiculos.store.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Store de vehículos con Pinia.
 *
 * USO EN COMPONENTES:
 *   import { useVehiculosStore } from '@/stores/vehiculos.store.js'
 *   const store = useVehiculosStore()
 *   await store.fetchAll()
 *   console.log(store.vehiculos)
 */

import { ref, computed } from 'vue';
import { defineStore }   from 'pinia';
import VEHICULOS_API     from '@/api/vehiculos.api.js';

export const useVehiculosStore = defineStore('vehiculos', () => {
  // ─── Estado ────────────────────────────────────────────────────────────────
  const vehiculos    = ref([]);
  const selected     = ref(null);
  const loading      = ref(false);
  const error        = ref(null);

  // ─── Getters ───────────────────────────────────────────────────────────────
  const disponibles = computed(() =>
    vehiculos.value.filter((v) => v.estado === 'disponible' || v.disponible === true),
  );

  const total = computed(() => vehiculos.value.length);

  // ─── Acciones ─────────────────────────────────────────────────────────────

  async function fetchAll(params = {}) {
    loading.value = true;
    error.value   = null;
    try {
      const data    = await VEHICULOS_API.getAll(params);
      vehiculos.value = Array.isArray(data) ? data : (data.data ?? data.vehiculos ?? []);
    } catch (err) {
      error.value = err.response?.data?.message ?? 'No se pudo cargar el catálogo';
    } finally {
      loading.value = false;
    }
  }

  async function fetchById(id) {
    loading.value = true;
    error.value   = null;
    try {
      const data  = await VEHICULOS_API.getById(id);
      selected.value = data.data ?? data;
      return selected.value;
    } catch (err) {
      error.value = err.response?.data?.message ?? 'Vehículo no encontrado';
    } finally {
      loading.value = false;
    }
  }

  function clearSelected() {
    selected.value = null;
  }

  return {
    vehiculos, selected, loading, error,
    disponibles, total,
    fetchAll, fetchById, clearSelected,
  };
});
