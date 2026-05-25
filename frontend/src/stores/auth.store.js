/**
 * src/stores/auth.store.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Store de autenticación con Pinia (Composition API style).
 *
 * Responsabilidades:
 *   ✅ Guardar token y datos del usuario en memoria + localStorage
 *   ✅ Exponer helpers: isAuthenticated, isAdmin
 *   ✅ login / register / logout / fetchMe
 *
 * USO EN COMPONENTES:
 *   import { useAuthStore } from '@/stores/auth.store.js'
 *   const auth = useAuthStore()
 *   await auth.login({ email, password })
 *   console.log(auth.user, auth.isAuthenticated)
 */

import { ref, computed } from 'vue';
import { defineStore }   from 'pinia';
import AUTH_API          from '@/api/auth.api.js';

export const useAuthStore = defineStore('auth', () => {
  // ─── Estado ────────────────────────────────────────────────────────────────
  const token   = ref(localStorage.getItem('auth_token') ?? null);
  const user    = ref(JSON.parse(localStorage.getItem('auth_user') ?? 'null'));
  const loading = ref(false);
  const error   = ref(null);

  // ─── Getters (computed) ────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin         = computed(() => user.value?.rol === 'admin' || user.value?.role === 'admin');
  const fullName        = computed(() => user.value?.nombre ?? user.value?.name ?? 'Usuario');

  // ─── Helpers privados ─────────────────────────────────────────────────────
  function _persist(newToken, newUser) {
    token.value = newToken;
    user.value  = newUser;
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user',  JSON.stringify(newUser));
  }

  function _clearSession() {
    token.value = null;
    user.value  = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_role');
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────

  /** Iniciar sesión */
  async function login(credentials) {
    loading.value = true;
    error.value   = null;
    try {
      const data = await AUTH_API.login(credentials);
      // El auth-service devuelve { token, user } o { access_token, data }
      const jwt      = data.token ?? data.access_token;
      const userData = data.user  ?? data.data;
      _persist(jwt, userData);
      return data;
    } catch (err) {
      error.value = err.response?.data?.error?.message ?? 'Error al iniciar sesión';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /** Registrar nuevo usuario */
  async function register(payload) {
    loading.value = true;
    error.value   = null;
    try {
      const data = await AUTH_API.register(payload);
      // Si el registro devuelve sesión directamente, persistimos
      if (data.token) {
        _persist(data.token, data.user ?? data.data);
      }
      return data;
    } catch (err) {
      error.value = err.response?.data?.error?.message ?? 'Error al registrarse';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /** Cerrar sesión */
  function logout() {
    _clearSession();
  }

  /** Refresca datos del usuario desde el servidor (útil al recargar la app) */
  async function fetchMe() {
    if (!token.value) return;
    try {
      const data = await AUTH_API.me();
      user.value = data.user ?? data.data ?? data;
      localStorage.setItem('auth_user', JSON.stringify(user.value));
    } catch {
      // Si falla (token expirado), limpiamos la sesión
      _clearSession();
    }
  }

  return {
    // estado
    token, user, loading, error,
    // getters
    isAuthenticated, isAdmin, fullName,
    // acciones
    login, register, logout, fetchMe,
  };
});
