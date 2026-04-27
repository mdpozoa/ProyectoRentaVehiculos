<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const paso = ref(1); // 1 = datos personales, 2 = credenciales
const cargando = ref(false);
const error = ref('');

import { onMounted } from 'vue';
const ciudades = ref([]);

onMounted(async () => {
  try {
    const res = await api.get('/Ciudades');
    ciudades.value = res.data;
  } catch (err) {
    console.error("Error al cargar ciudades:", err);
  }
});

const persona = ref({
  Cedula_Persona: '',
  Nombre_Persona: '',
  Apellido_Persona: '',
  F_Nacimiento_Persona: '',
  Direccion_Persona: '',
  Telefono_Persona: '',
  Correo_Persona: '',
  ID_Ciudad: ''
});

const usuario = ref({
  User_Usuario: '',
  Pass_Usuario: '',
  confirmarPass: '',
  Rol_Usuario: 'Cliente'
});

const registrar = async () => {
  if (usuario.value.Pass_Usuario !== usuario.value.confirmarPass) {
    error.value = 'Las contraseñas no coinciden.';
    return;
  }

  cargando.value = true;
  error.value = '';

  try {
    // 1. Crear persona
    const resPer = await api.post('/Personas', persona.value);
    const idPersona = resPer.data?.ID_Persona;

    // 2. Crear usuario vinculado a esa persona
    await api.post('/Usuarios', {
      ID_Persona: idPersona,
      User_Usuario: usuario.value.User_Usuario,
      Pass_Usuario: usuario.value.Pass_Usuario,
      Rol_Usuario: 'Cliente'
    });

    // 3. Hacer login automático
    const resLogin = await api.post('/Auth/login', {
      User_usuario: usuario.value.User_Usuario,
      Pass_usuario: usuario.value.Pass_Usuario
    });

    localStorage.setItem('auth_token', resLogin.data.token);
    localStorage.setItem('user_role', resLogin.data.rol);
    localStorage.setItem('user_name', usuario.value.User_Usuario);

    // 4. Redirigir
    const vehiculoPendiente = localStorage.getItem('vehiculo_pendiente');
    if (vehiculoPendiente) {
      const vehiculo = JSON.parse(vehiculoPendiente);
      router.push({ name: 'reservar', params: { id: vehiculo.ID_Vehiculo } });
    } else {
      router.push('/vehiculos');
    }

  } catch (err) {
    error.value = err.response?.data?.error || 'Error al registrarse. Intenta nuevamente.';
  } finally {
    cargando.value = false;
  }
};
</script>

<template>
  <div class="registro-page">
    <div class="registro-card">

      <div class="registro-header">
        <router-link to="/">
          <img src="/imagens/CARRO LETRAS.png" alt="Zenith Drive" style="height: 50px;">
        </router-link>
        <h1>Crear cuenta</h1>
        <p>Regístrate para hacer tu reserva</p>
      </div>

      <!-- Indicador de pasos -->
      <div class="pasos">
        <div class="paso" :class="{ activo: paso === 1, completado: paso > 1 }">
          <span class="paso-num">1</span>
          <span class="paso-label">Datos personales</span>
        </div>
        <div class="paso-linea"></div>
        <div class="paso" :class="{ activo: paso === 2 }">
          <span class="paso-num">2</span>
          <span class="paso-label">Credenciales</span>
        </div>
      </div>

      <!-- PASO 1: Datos personales -->
      <form v-if="paso === 1" @submit.prevent="paso = 2" class="form">
        <div class="campo-grid">
          <div class="campo">
            <label>Cédula *</label>
            <input v-model="persona.Cedula_Persona" type="text" placeholder="0912345678" required maxlength="10" />
          </div>
          <div class="campo">
            <label>Fecha de nacimiento *</label>
            <input v-model="persona.F_Nacimiento_Persona" type="date" required />
          </div>
          <div class="campo">
            <label>Nombre *</label>
            <input v-model="persona.Nombre_Persona" type="text" placeholder="Juan" required />
          </div>
          <div class="campo">
            <label>Apellido *</label>
            <input v-model="persona.Apellido_Persona" type="text" placeholder="Pérez" required />
          </div>
          <div class="campo campo-full">
            <label>Dirección *</label>
            <input v-model="persona.Direccion_Persona" type="text" placeholder="Av. Principal 123" required />
          </div>
          <div class="campo">
            <label>Teléfono *</label>
            <input v-model="persona.Telefono_Persona" type="tel" placeholder="0991234567" required />
          </div>
          <div class="campo">
            <label>Correo electrónico *</label>
            <input v-model="persona.Correo_Persona" type="email" placeholder="juan@email.com" required />
          </div>
          <div class="campo campo-full">
            <label>Ciudad *</label>
            <select v-model="persona.ID_Ciudad" class="input-select" required>
              <option value="" disabled>Selecciona tu ciudad</option>
              <option v-for="c in ciudades" :key="c.ID_Ciudad" :value="c.ID_Ciudad">
                {{ c.Nombre_Ciudad }} — {{ c.Provincia_Ciudad }}
              </option>
            </select>
          </div>
        </div>

        <button type="submit" class="btn-primary btn-block">
          Continuar →
        </button>
        <p class="link-login">¿Ya tienes cuenta? <router-link to="/login">Inicia sesión</router-link></p>
      </form>

      <!-- PASO 2: Credenciales -->
      <form v-if="paso === 2" @submit.prevent="registrar" class="form">
        <div class="campo-grid">
          <div class="campo campo-full">
            <label>Nombre de usuario *</label>
            <input v-model="usuario.User_Usuario" type="text" placeholder="juanperez123" required />
          </div>
          <div class="campo">
            <label>Contraseña *</label>
            <input v-model="usuario.Pass_Usuario" type="password" placeholder="Mínimo 6 caracteres" required minlength="6" />
          </div>
          <div class="campo">
            <label>Confirmar contraseña *</label>
            <input v-model="usuario.confirmarPass" type="password" placeholder="Repite tu contraseña" required />
          </div>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <div class="btn-grupo">
          <button type="button" class="btn-secundario" @click="paso = 1">← Atrás</button>
          <button type="submit" class="btn-primary" :disabled="cargando">
            {{ cargando ? 'Registrando...' : 'Crear cuenta ✓' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<style scoped>
.registro-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-darker, #0d0d1a);
}

.registro-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 560px;
}

.registro-header {
  text-align: center;
  margin-bottom: 2rem;
}

.registro-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
  margin: 1rem 0 0.25rem;
}

.registro-header p {
  color: #888;
  font-size: 0.9rem;
}

/* Pasos */
.pasos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 2rem;
}

.paso {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.paso-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.paso.activo .paso-num {
  background: var(--primary, #f97316);
  color: white;
}

.paso.completado .paso-num {
  background: #22c55e;
  color: white;
}

.paso-label {
  font-size: 0.72rem;
  color: #666;
  white-space: nowrap;
}

.paso.activo .paso-label { color: var(--primary, #f97316); }

.paso-linea {
  width: 80px;
  height: 1px;
  background: rgba(255,255,255,0.15);
  margin: 0 8px;
  margin-bottom: 18px;
}

/* Formulario */
.form { display: flex; flex-direction: column; gap: 1rem; }

.campo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.campo { display: flex; flex-direction: column; gap: 6px; }
.campo-full { grid-column: 1 / -1; }

.campo label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.campo input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  color: white;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.campo input:focus {
  outline: none;
  border-color: var(--primary, #f97316);
}

.campo input::placeholder { color: #555; }

.input-select {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  color: white;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
  cursor: pointer;
}
.input-select:focus {
  outline: none;
  border-color: var(--primary, #f97316);
}
.input-select option {
  background: #0d0d1a;
  color: white;
}

.btn-block { width: 100%; }

.btn-grupo {
  display: flex;
  gap: 1rem;
}

.btn-secundario {
  flex: 1;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: transparent;
  color: #aaa;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secundario:hover { background: rgba(255,255,255,0.07); color: white; }

.btn-primary {
  flex: 2;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  background: var(--primary, #f97316);
  color: white;
  font-weight: 700;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  transition: opacity 0.2s;
}

.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { opacity: 0.9; }

.error-msg {
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.link-login {
  text-align: center;
  color: #666;
  font-size: 0.85rem;
}

.link-login a { color: var(--primary, #f97316); }
</style>