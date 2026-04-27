import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- RUTAS PÚBLICAS ---
    {
      path: '/',
      component: () => import('../components/PublicLayout.vue'),
      children: [
        { path: '', name: 'inicio', component: () => import('../views/Inicio.vue') },
        { path: 'vehiculos', name: 'vehiculos-public', component: () => import('../views/Vehiculos.vue') },
        { path: 'agencias', name: 'agencias-public', component: () => import('../views/Agencias.vue') },
        { path: 'contacto', name: 'contacto', component: () => import('../views/Contacto.vue') },
        // --- RUTAS DE CLIENTE ---
        { path: 'reservar/:id', name: 'reservar', component: () => import('../views/Reservar.vue'), meta: { requiresAuth: true } },
        { path: 'pago', name: 'pago', component: () => import('../views/Pago.vue'), meta: { requiresAuth: true } },
        { path: 'mis-reservas', name: 'mis-reservas', component: () => import('../views/MisReservas.vue'), meta: { requiresAuth: true } }
      ]
    },
    // --- REGISTRO ---
    {
      path: '/registro',
      name: 'registro',
      component: () => import('../views/Registro.vue')
    },

    // --- LOGIN ---
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    // --- PANEL ADMINISTRATIVO ---
    {
      path: '/admin',
      component: () => import('../components/Layout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }, // ← agregado requiresAdmin
      redirect: '/admin/vehiculos',
      children: [
        // Catálogos Base
        { path: 'ciudades',        name: 'admin-ciudades',        component: () => import('../views/admin/Ciudades.vue') },
        { path: 'marcas',          name: 'admin-marcas',          component: () => import('../views/admin/Marcas.vue') },
        { path: 'categorias',      name: 'admin-categorias',      component: () => import('../views/admin/Categorias.vue') },
        { path: 'modelos',         name: 'admin-modelos',         component: () => import('../views/admin/Modelos.vue') },
        { path: 'tarifas',         name: 'admin-tarifas',         component: () => import('../views/admin/Tarifas.vue') },
        // Seguridad
        { path: 'personas',        name: 'admin-personas',        component: () => import('../views/admin/Personas.vue') },
        { path: 'usuarios',        name: 'admin-usuarios',        component: () => import('../views/admin/Usuarios.vue') },
        { path: 'auditorias',      name: 'admin-auditorias',      component: () => import('../views/admin/Auditorias.vue') },
        // Vehículos
        { path: 'agencias',        name: 'admin-agencias',        component: () => import('../views/admin/Agencias.vue') },
        { path: 'vehiculos',       name: 'admin-vehiculos',       component: () => import('../views/admin/VehiculosAdmin.vue') },
        { path: 'kardex',          name: 'admin-kardex',          component: () => import('../views/admin/Kardex.vue') },
        { path: 'siniestros',      name: 'admin-siniestros',      component: () => import('../views/admin/Siniestros.vue') },
        // Operaciones
        { path: 'reservas',        name: 'admin-reservas',        component: () => import('../views/admin/Reservas.vue') },
        { path: 'contratos',       name: 'admin-contratos',       component: () => import('../views/admin/Contratos.vue') },
        { path: 'facturas',        name: 'admin-facturas',        component: () => import('../views/admin/Facturas.vue') },
        { path: 'detallefacturas', name: 'admin-detallefacturas', component: () => import('../views/admin/DetalleFactura.vue') },
        { path: 'pagos',           name: 'admin-pagos',           component: () => import('../views/admin/Pagos.vue') },
      ]
    }
  ]
});

// Guardias de navegación
router.beforeEach((to, from) => {
  const token = localStorage.getItem('auth_token');
  const role  = localStorage.getItem('user_role');

  if (to.meta.requiresAuth) {
    if (!token) {
      // No hay sesión → ir al login
      return { name: 'login' };
    } else if (to.meta.requiresAdmin && role !== 'admin') {
      // Hay sesión pero no es Admin → volver al inicio
      return { name: 'inicio' };
    }
  }
  return true;
});


export default router;