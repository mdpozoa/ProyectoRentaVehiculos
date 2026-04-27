<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

// ─── Estado global ─────────────────────────────────────────────
const mode = ref('login'); // 'login' | 'register'
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

// ─── Datos login ────────────────────────────────────────────────
const username = ref('');
const password = ref('');

// ─── Datos registro ─────────────────────────────────────────────
const ciudades = ref([]);
const form = ref({
  // Persona
  Cedula_Persona: '',
  Nombre_Persona: '',
  Apellido_Persona: '',
  F_Nacimiento_Persona: '',
  Direccion_Persona: '',
  Telefono_Persona: '',
  Correo_Persona: '',
  ID_Ciudad: '',
  // Usuario
  User_usuario: '',
  Pass_usuario: '',
  Confirmar_Pass: '',
});

onMounted(async () => {
  try {
    const res = await api.get('/Ciudades');
    ciudades.value = res.data;
  } catch {
    // silently fail - ciudades se cargará vacío
  }
});

// ─── Login ───────────────────────────────────────────────────────
const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const response = await api.post('/Auth/login', {
      User_Usuario: username.value,
      Pass_Usuario: password.value,
    });
    const { token, rol } = response.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_role', rol.toLowerCase());
    if (rol.toLowerCase() === 'admin' || rol.toLowerCase() === 'administrador') {
      router.push('/admin/vehiculos');
    } else {
      const vehiculoPendiente = localStorage.getItem('vehiculo_pendiente');
      if (vehiculoPendiente) {
        const vehiculo = JSON.parse(vehiculoPendiente);
        router.push({ name: 'reservar', params: { id: vehiculo.ID_Vehiculo } });
      } else {
        router.push('/vehiculos');
      }
    }
  } catch (err) {
    if (err.response && err.response.status === 401) {
      errorMsg.value = err.response.data.error || 'Usuario o contraseña incorrectos.';
    } else {
      errorMsg.value = 'Error al conectar con el servidor.';
    }
  } finally {
    loading.value = false;
  }
};

// ─── Registro ────────────────────────────────────────────────────
const handleRegister = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  // Validaciones básicas
  if (form.value.Pass_usuario !== form.value.Confirmar_Pass) {
    errorMsg.value = 'Las contraseñas no coinciden.';
    return;
  }
  if (!form.value.ID_Ciudad) {
    errorMsg.value = 'Por favor selecciona tu ciudad.';
    return;
  }

  loading.value = true;
  try {
    // Paso 1: Crear Persona
    const personaPayload = {
      ID_Ciudad: parseInt(form.value.ID_Ciudad),
      Cedula_Persona: form.value.Cedula_Persona,
      Nombre_Persona: form.value.Nombre_Persona,
      Apellido_Persona: form.value.Apellido_Persona,
      F_Nacimiento_Persona: form.value.F_Nacimiento_Persona,
      Direccion_Persona: form.value.Direccion_Persona,
      Telefono_Persona: form.value.Telefono_Persona,
      Correo_Persona: form.value.Correo_Persona,
    };
    const personaRes = await api.post('/Personas', personaPayload);
    const idPersona = personaRes.data?.ID_Persona;

    if (!idPersona) throw new Error('No se pudo obtener el ID de la persona registrada.');

    // Paso 2: Crear Usuario vinculado a la persona
    const usuarioPayload = {
      ID_Persona: idPersona,
      User_Usuario: form.value.User_usuario,
      Pass_Usuario: form.value.Pass_usuario,
      Rol_Usuario: 'Cliente',
    };
    await api.post('/Usuarios', usuarioPayload);

    // Paso 3: Login automático
    const loginRes = await api.post('/Auth/login', {
      User_Usuario: form.value.User_usuario,
      Pass_Usuario: form.value.Pass_usuario,
    });
    const { token, rol } = loginRes.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_role', rol.toLowerCase());
    const vehiculoPendiente = localStorage.getItem('vehiculo_pendiente');
    if (vehiculoPendiente) {
      const vehiculo = JSON.parse(vehiculoPendiente);
      router.push({ name: 'reservar', params: { id: vehiculo.ID_Vehiculo } });
    } else {
      router.push('/vehiculos');
    }
  } catch (err) {
    const detail =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.response?.data ||
      err.message ||
      'Error al registrar. Verifica los datos e intenta nuevamente.';
    errorMsg.value = typeof detail === 'string' ? detail : JSON.stringify(detail);
  } finally {
    loading.value = false;
  }
};

const switchMode = (newMode) => {
  mode.value = newMode;
  errorMsg.value = '';
  successMsg.value = '';
};
</script>

<template>
  <div class="login-wrapper bg-dark">
    <div class="glass-panel login-box animate-fade-in">

      <!-- BRAND -->
      <div class="brand">
        <div class="logo-box">
          <span style="font-size: 2.5rem; color: var(--primary);">🏎️</span>
        </div>
        <h1 class="text-white" style="margin-top:0.75rem;">
          {{ mode === 'login' ? 'Acceso a Plataforma' : 'Crear Cuenta' }}
        </h1>
        <p class="text-muted">
          {{ mode === 'login' ? 'Inicia sesión para continuar' : 'Regístrate como cliente nuevo' }}
        </p>
      </div>

      <!-- ══════════ FORMULARIO LOGIN ══════════ -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="login-form">
        <div class="form-group text-left">
          <label for="username" class="text-white">Usuario</label>
          <input
            type="text"
            id="username"
            v-model="username"
            class="input-field"
            placeholder="Escribe tu usuario..."
            required
          />
        </div>

        <div class="form-group text-left">
          <label for="password" class="text-white">Contraseña</label>
          <input
            type="password"
            id="password"
            v-model="password"
            class="input-field"
            placeholder="••••••••"
            required
          />
        </div>

        <div v-if="errorMsg" class="alert-msg alert-danger">{{ errorMsg }}</div>

        <button type="submit" class="btn-primary btn-full" :disabled="loading">
          <span v-if="loading">Verificando...</span>
          <span v-else>Iniciar Sesión</span>
        </button>

        <div class="divider"><span>¿No tienes cuenta?</span></div>

        <button type="button" class="btn-outline btn-full" @click="switchMode('register')">
          Crear nueva cuenta
        </button>
      </form>

      <!-- ══════════ FORMULARIO REGISTRO ══════════ -->
      <form v-else @submit.prevent="handleRegister" class="login-form">

        <div class="section-title">Datos Personales</div>

        <div class="form-row">
          <div class="form-group text-left">
            <label class="text-white">Cédula / DNI</label>
            <input type="text" v-model="form.Cedula_Persona" class="input-field" placeholder="0912345678" required />
          </div>
          <div class="form-group text-left">
            <label class="text-white">Teléfono</label>
            <input type="tel" v-model="form.Telefono_Persona" class="input-field" placeholder="0991234567" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group text-left">
            <label class="text-white">Nombres</label>
            <input type="text" v-model="form.Nombre_Persona" class="input-field" placeholder="Juan" required />
          </div>
          <div class="form-group text-left">
            <label class="text-white">Apellidos</label>
            <input type="text" v-model="form.Apellido_Persona" class="input-field" placeholder="Pérez" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group text-left">
            <label class="text-white">Fecha de Nacimiento</label>
            <input type="date" v-model="form.F_Nacimiento_Persona" class="input-field" required />
          </div>
          <div class="form-group text-left">
            <label class="text-white">Ciudad</label>
            <select v-model="form.ID_Ciudad" class="input-field" required>
              <option value="" disabled>Selecciona tu ciudad</option>
              <option v-for="c in ciudades" :key="c.ID_Ciudad" :value="c.ID_Ciudad">
                {{ c.Nombre_Ciudad }} — {{ c.Provincia_Ciudad }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group text-left">
          <label class="text-white">Dirección</label>
          <input type="text" v-model="form.Direccion_Persona" class="input-field" placeholder="Av. Ejemplo 123" required />
        </div>

        <div class="form-group text-left">
          <label class="text-white">Correo Electrónico</label>
          <input type="email" v-model="form.Correo_Persona" class="input-field" placeholder="correo@ejemplo.com" required />
        </div>

        <div class="section-title" style="margin-top:1rem;">Credenciales de Acceso</div>

        <div class="form-group text-left">
          <label class="text-white">Nombre de Usuario</label>
          <input type="text" v-model="form.User_usuario" class="input-field" placeholder="juan.perez" required />
        </div>

        <div class="form-row">
          <div class="form-group text-left">
            <label class="text-white">Contraseña</label>
            <input type="password" v-model="form.Pass_usuario" class="input-field" placeholder="••••••••" minlength="6" required />
          </div>
          <div class="form-group text-left">
            <label class="text-white">Confirmar Contraseña</label>
            <input type="password" v-model="form.Confirmar_Pass" class="input-field" placeholder="••••••••" minlength="6" required />
          </div>
        </div>

        <div v-if="errorMsg" class="alert-msg alert-danger">{{ errorMsg }}</div>
        <div v-if="successMsg" class="alert-msg alert-success">{{ successMsg }}</div>

        <button type="submit" class="btn-primary btn-full" :disabled="loading">
          <span v-if="loading">Registrando...</span>
          <span v-else>✅ Crear Cuenta y Entrar</span>
        </button>

        <div class="divider"><span>¿Ya tienes cuenta?</span></div>

        <button type="button" class="btn-outline btn-full" @click="switchMode('login')">
          Iniciar Sesión
        </button>
      </form>

    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  padding: 2rem 1rem;
  overflow-y: auto;
}

.login-box {
  width: 100%;
  max-width: 560px;
  padding: 2.5rem 2.5rem;
  text-align: center;
  margin: auto;
}

.brand {
  margin-bottom: 2rem;
}

.logo-box {
  display: flex;
  justify-content: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: var(--text-muted);
}

.section-title {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--primary);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--glass-border);
  margin-top: 0.5rem;
}

.btn-full {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.85rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 700;
}

.btn-outline {
  background: transparent;
  border: 1.5px solid var(--glass-border);
  color: var(--text-muted);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.75rem;
}

.btn-outline:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.divider {
  position: relative;
  text-align: center;
  margin: 0.5rem 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 38%;
  height: 1px;
  background: var(--glass-border);
}

.divider::before { left: 0; }
.divider::after { right: 0; }

.divider span {
  background: transparent;
  padding: 0 0.75rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  position: relative;
  z-index: 1;
}

.alert-msg {
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.alert-danger {
  background: rgba(250, 50, 50, 0.15);
  color: #f87171;
  border: 1px solid rgba(250, 50, 50, 0.3);
}

.alert-success {
  background: rgba(30, 200, 100, 0.15);
  color: #4ade80;
  border: 1px solid rgba(30, 200, 100, 0.3);
}

select.input-field {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
  cursor: pointer;
}

select.input-field option {
  background: #1a1a2e;
  color: #fff;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  .login-box {
    padding: 2rem 1.25rem;
  }
}
</style>
