<script setup>
import { ref, watch, computed } from 'vue';
import api from '../services/api';

// ─── Props ────────────────────────────────────────────────────────
const props = defineProps({
  /** Visible o no */
  modelValue: { type: Boolean, default: false },
  /** Modo: 'create' | 'edit' | 'view' */
  mode: { type: String, default: 'create' },
  /** Definición de campos: [{ key, label, type, required, readOnly }] */
  fields: { type: Array, required: true },
  /** Objeto con los datos del registro (para edit/view) */
  item: { type: Object, default: null },
  /** Nombre de la PK en el JSON del API, ej: 'ID_Vehiculo' */
  primaryKey: { type: String, required: true },
  /** Endpoint del API, ej: '/Vehiculos' */
  endpoint: { type: String, required: true },
  /** Nombre amigable del módulo, ej: 'Vehículo' */
  moduleName: { type: String, default: 'Registro' },
});

const emit = defineEmits(['update:modelValue', 'saved']);

// ─── Estado interno ───────────────────────────────────────────────
const formData = ref({});
const loading = ref(false);
const errorMsg = ref('');

const modeLabel = computed(() => {
  if (props.mode === 'create') return 'Nuevo';
  if (props.mode === 'edit')   return 'Editar';
  return 'Detalle';
});

const isReadOnly = computed(() => props.mode === 'view');

// Inicializar formData cuando cambia el item o se abre el modal
watch(
  () => [props.item, props.modelValue],
  () => {
    errorMsg.value = '';
    if (props.item) {
      formData.value = { ...props.item };
    } else {
      // Crear objeto vacío con los campos definidos
      const empty = {};
      props.fields.forEach(f => {
        if (!f.readOnly) empty[f.key] = f.defaultValue ?? '';
      });
      formData.value = empty;
    }
  },
  { immediate: true }
);

// ─── Helpers ──────────────────────────────────────────────────────
const getInputType = (field) => {
  if (field.type === 'number') return 'number';
  if (field.type === 'decimal') return 'number';
  if (field.type === 'date') return 'date';
  if (field.type === 'datetime') return 'datetime-local';
  if (field.type === 'password') return 'password';
  if (field.type === 'email') return 'email';
  return 'text';
};

const formatForInput = (field, value) => {
  if ((field.type === 'date' || field.type === 'datetime') && value) {
    try {
      return new Date(value).toISOString().slice(0, field.type === 'date' ? 10 : 16);
    } catch { return ''; }
  }
  return value ?? '';
};

// ─── Acciones ────────────────────────────────────────────────────
const close = () => {
  emit('update:modelValue', false);
  errorMsg.value = '';
};

const handleSubmit = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const payload = {};
    props.fields.forEach(f => {
      if (f.readOnly && props.mode === 'create') return; // skip PK al crear
      const val = formData.value[f.key];
      if (f.type === 'number' || f.type === 'decimal') {
        payload[f.key] = val === '' || val === null || val === undefined ? null : Number(val);
      } else if (f.type === 'date' || f.type === 'datetime') {
        payload[f.key] = val || null;
      } else {
        payload[f.key] = val;
      }
    });

    if (props.mode === 'create') {
      await api.post(props.endpoint, payload);
    } else if (props.mode === 'edit') {
      // Incluir PK al editar
      payload[props.primaryKey] = formData.value[props.primaryKey];
      await api.put(props.endpoint, payload);
    }

    emit('saved');
    close();
  } catch (err) {
    errorMsg.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Error al guardar. Verifica los datos.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal-container glass-panel" role="dialog" :aria-label="modeLabel + ' ' + moduleName">

          <!-- CABECERA -->
          <div class="modal-header">
            <div>
              <span class="modal-badge">
                {{ mode === 'create' ? '➕' : mode === 'edit' ? '✏️' : '👁️' }}
              </span>
              <span class="modal-title">{{ modeLabel }} {{ moduleName }}</span>
            </div>
            <button class="modal-close" @click="close" title="Cerrar">✕</button>
          </div>

          <!-- CONTENIDO -->
          <form @submit.prevent="handleSubmit" class="modal-body">
            <div class="modal-fields-grid">
              <template v-for="field in fields" :key="field.key">
                <!-- Omitir PK en modo crear -->
                <div
                  v-if="!(field.readOnly && mode === 'create')"
                  class="modal-field"
                  :class="{ 'field-full': field.fullWidth }"
                >
                  <label class="field-label">
                    {{ field.label }}
                    <span v-if="field.required && !isReadOnly" class="required-star">*</span>
                  </label>

                  <!-- Textarea -->
                  <textarea
                    v-if="field.type === 'textarea'"
                    v-model="formData[field.key]"
                    class="input-field"
                    :placeholder="field.placeholder || ''"
                    :required="field.required && !isReadOnly"
                    :disabled="isReadOnly || field.readOnly"
                    rows="3"
                  ></textarea>

                  <!-- Select con options -->
                  <select
                    v-else-if="field.type === 'select' && field.options"
                    v-model="formData[field.key]"
                    class="input-field"
                    :required="field.required && !isReadOnly"
                    :disabled="isReadOnly || field.readOnly"
                  >
                    <option value="" disabled>Selecciona...</option>
                    <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>

                  <!-- Input normal -->
                  <input
                    v-else
                    :type="getInputType(field)"
                    :value="formatForInput(field, formData[field.key])"
                    @input="formData[field.key] = $event.target.value"
                    class="input-field"
                    :placeholder="field.placeholder || ''"
                    :required="field.required && !isReadOnly"
                    :disabled="isReadOnly || field.readOnly"
                    :step="field.type === 'decimal' ? '0.01' : undefined"
                    :min="field.min ?? undefined"
                    :max="field.max ?? undefined"
                  />
                </div>
              </template>
            </div>

            <!-- Error -->
            <div v-if="errorMsg" class="modal-error">❌ {{ errorMsg }}</div>

            <!-- Acciones -->
            <div class="modal-footer" v-if="!isReadOnly">
              <button type="button" class="btn-cancel" @click="close" :disabled="loading">
                Cancelar
              </button>
              <button type="submit" class="btn-primary modal-save-btn" :disabled="loading">
                <span v-if="loading">Guardando...</span>
                <span v-else>{{ mode === 'create' ? '✅ Crear Registro' : '💾 Guardar Cambios' }}</span>
              </button>
            </div>
            <div class="modal-footer" v-else>
              <button type="button" class="btn-primary modal-save-btn" @click="close">
                Cerrar
              </button>
            </div>
          </form>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
}

.modal-container {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px;
  padding: 0;
}

/* Scroll personalizado */
.modal-container::-webkit-scrollbar { width: 6px; }
.modal-container::-webkit-scrollbar-track { background: transparent; }
.modal-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.75rem;
  border-bottom: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  background: var(--dark-bg, #0d0d1a);
  z-index: 1;
}

.modal-badge {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main, #fff);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}
.modal-close:hover { background: rgba(255,255,255,0.07); color: var(--text-main); }

.modal-body {
  padding: 1.75rem;
}

.modal-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-full {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted, #888);
}

.required-star {
  color: #f87171;
  margin-left: 2px;
}

.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

select.input-field {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

select.input-field option {
  background: #1a1a2e;
  color: #fff;
}

textarea.input-field {
  resize: vertical;
  min-height: 80px;
}

.modal-error {
  margin-top: 1rem;
  padding: 0.65rem 1rem;
  background: rgba(250, 50, 50, 0.15);
  border: 1px solid rgba(250, 50, 50, 0.3);
  border-radius: 8px;
  color: #f87171;
  font-size: 0.85rem;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--glass-border);
}

.btn-cancel {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--glass-border);
  color: var(--text-muted);
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.btn-cancel:hover { background: rgba(255,255,255,0.1); color: var(--text-main); }

.modal-save-btn {
  padding: 0.7rem 1.75rem;
  font-size: 0.9rem;
}

/* Animación entrada/salida */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.25s ease;
}
.modal-fade-enter-from .modal-container {
  transform: translateY(-20px) scale(0.97);
}
.modal-fade-leave-to .modal-container {
  transform: translateY(10px) scale(0.97);
}

@media (max-width: 560px) {
  .modal-fields-grid {
    grid-template-columns: 1fr;
  }
  .modal-backdrop {
    padding: 0.5rem;
    align-items: flex-end;
  }
  .modal-container {
    max-height: 95vh;
    border-radius: 16px 16px 0 0;
  }
}
</style>
