/**
 * src/composables/useCatalogos.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Composable que carga y cachea los catálogos de referencia (Modelos,
 * Categorías, Agencias, Marcas, Ciudades). Cualquier componente que lo importe
 * comparte la MISMA instancia de datos — sin fetch duplicados.
 *
 * PATRÓN: Module-level singleton (caché fuera del composable)
 *
 * USO:
 *   import { useCatalogos } from '@/composables/useCatalogos.js'
 *
 *   const { modelos, categorias, agencias, loadingCatalogos, cargarCatalogos } = useCatalogos()
 *   await cargarCatalogos()   // solo hace fetch si no están cargados
 *
 *   // En el template:
 *   <select v-model="form.ID_Modelo">
 *     <option v-for="m in modelos" :key="m.value" :value="m.value">{{ m.label }}</option>
 *   </select>
 */

import { ref } from 'vue';
import api from '@/services/api.js';

// ── Caché a nivel de módulo (singleton compartido entre todos los componentes) ─
const _cache = {
  modelos:    null,
  categorias: null,
  agencias:   null,
  marcas:     null,
  ciudades:   null,
  vehiculos:  null,
};

// Estado reactivo compartido
const modelos    = ref([]);
const categorias = ref([]);
const agencias   = ref([]);
const marcas     = ref([]);
const ciudades   = ref([]);
const vehiculos  = ref([]);
const loadingCatalogos = ref(false);
const errorCatalogos   = ref(null);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte la respuesta del API en opciones para <select>:
 *   [{ value: id, label: 'nombre visible' }]
 *
 * @param {Array}  data     - Array de objetos del API
 * @param {string} idKey    - Nombre de la propiedad que es la PK
 * @param {string} labelKey - Nombre de la propiedad a mostrar al usuario
 */
function toOptions(data, idKey, labelKey) {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    value: item[idKey],
    label: item[labelKey] ?? `(ID: ${item[idKey]})`,
  }));
}

/**
 * Fetch seguro: retorna el caché si ya está cargado.
 */
async function fetchIfNeeded(cacheKey, endpoint) {
  if (_cache[cacheKey]) return _cache[cacheKey];
  const res = await api.get(endpoint);
  _cache[cacheKey] = res.data;
  return _cache[cacheKey];
}

// ── Composable ───────────────────────────────────────────────────────────────

export function useCatalogos() {
  /**
   * Carga todos los catálogos en paralelo.
   * Llama a esto en onMounted() del componente que los necesita.
   * Si ya se cargaron antes, es instantáneo (usa caché).
   */
  async function cargarCatalogos() {
    if (loadingCatalogos.value) return; // evitar fetch doble
    loadingCatalogos.value = true;
    errorCatalogos.value   = null;

    try {
      const [rawModelos, rawCategorias, rawAgencias, rawMarcas, rawCiudades, rawVehiculos] =
        await Promise.all([
          fetchIfNeeded('modelos',    '/Modelos'),
          fetchIfNeeded('categorias', '/Categorias'),
          fetchIfNeeded('agencias',   '/Agencias'),
          fetchIfNeeded('marcas',     '/Marcas'),
          fetchIfNeeded('ciudades',   '/Ciudades'),
          fetchIfNeeded('vehiculos',  '/Vehiculos'),
        ]);

      // Adaptar a { value, label } para los <select>
      // ⚠️ Ajusta los nombres de campo (idKey, labelKey) si tu API usa otros nombres
      modelos.value    = toOptions(rawModelos,    'ID_Modelo',    'Nombre_Modelo');
      categorias.value = toOptions(rawCategorias, 'ID_Categoria', 'Nombre_Categoria');
      agencias.value   = toOptions(rawAgencias,   'ID_Agencia',   'Nombre_Agencia');
      marcas.value     = toOptions(rawMarcas,     'ID_Marca',     'Nombre_Marca');
      ciudades.value   = toOptions(rawCiudades,   'ID_Ciudad',    'Nombre_Ciudad');
      // Vehículos: label = Placa + Año (lo que el admin reconoce visualmente)
      vehiculos.value  = (Array.isArray(rawVehiculos) ? rawVehiculos : []).map(v => ({
        value: v.ID_Vehiculo,
        label: `${v.Placa_Vehiculo ?? '?'} — ${v.Anio_Vehiculo ?? ''} ${v.Color_Vehiculo ?? ''}`.trim(),
      }));
    } catch (err) {
      errorCatalogos.value =
        err.response?.data?.message ?? 'No se pudieron cargar los catálogos.';
      console.error('[useCatalogos] Error:', err);
    } finally {
      loadingCatalogos.value = false;
    }
  }

  /** Limpia el caché (útil si un admin crea un nuevo modelo/agencia y
   *  quiere ver el cambio reflejado en el siguiente fetch) */
  function invalidarCatalogos(...keys) {
    const targets = keys.length ? keys : Object.keys(_cache);
    targets.forEach((k) => { _cache[k] = null; });
  }

  return {
    // datos listos para <select :options="...">
    modelos,
    categorias,
    agencias,
    marcas,
    ciudades,
    vehiculos,
    // estado
    loadingCatalogos,
    errorCatalogos,
    // acciones
    cargarCatalogos,
    invalidarCatalogos,
  };
}
