<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const userName = localStorage.getItem('user_role') || 'Admin';

const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_role');
  router.push('/login');
};

// Categorías colapsables del sidebar
const menuGroups = ref([
  {
    label: 'Catálogos Base',
    icon: '📚',
    open: false,
    items: [
      { name: 'Ciudades', path: '/admin/ciudades', icon: '🏙️' },
      { name: 'Marcas', path: '/admin/marcas', icon: '🏷️' },
      { name: 'Categorías', path: '/admin/categorias', icon: '📂' },
      { name: 'Modelos', path: '/admin/modelos', icon: '🔧' },
      { name: 'Tarifas', path: '/admin/tarifas', icon: '💰' },
    ]
  },
  {
    label: 'Seguridad',
    icon: '🔐',
    open: false,
    items: [
      { name: 'Personas', path: '/admin/personas', icon: '👤' },
      { name: 'Usuarios', path: '/admin/usuarios', icon: '💼' },
      { name: 'Auditorías', path: '/admin/auditorias', icon: '📋' },
    ]
  },
  {
    label: 'Vehículos',
    icon: '🚗',
    open: false,
    items: [
      { name: 'Agencias', path: '/admin/agencias', icon: '🏢' },
      { name: 'Vehículos', path: '/admin/vehiculos', icon: '🚙' },
      { name: 'Kardex', path: '/admin/kardex', icon: '📊' },
      { name: 'Siniestros', path: '/admin/siniestros', icon: '⚠️' },
    ]
  },
  {
    label: 'Operaciones',
    icon: '📑',
    open: false,
    items: [
      { name: 'Reservas', path: '/admin/reservas', icon: '📅' },
      { name: 'Contratos', path: '/admin/contratos', icon: '📝' },
      { name: 'Facturas', path: '/admin/facturas', icon: '🧾' },
      { name: 'Detalle Facturas', path: '/admin/detallefacturas', icon: '📄' },
      { name: 'Pagos', path: '/admin/pagos', icon: '💳' },
    ]
  },
]);

const currentPath = computed(() => route.path);

const toggleGroup = (group) => {
  group.open = !group.open;
};

const isGroupActive = (group) => {
  return group.items.some(item => currentPath.value === item.path);
};
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar glass-panel">
      <div class="sidebar-header">
        <img src="/imagens/CARRO LETRAS.png" alt="Logo" style="height: 50px; margin-right: 0.5rem;">
        <div>
          <h2>Zenith Drive</h2>
          <p class="sidebar-role">Panel Administrador</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <!-- Agrupaciones colapsables -->
        <div v-for="group in menuGroups" :key="group.label" class="nav-group">
          <!-- Encabezado del grupo -->
          <button 
            class="nav-group-header"
            :class="{ 'active-group': isGroupActive(group) }"
            @click="toggleGroup(group)"
          >
            <span class="icon">{{ group.icon }}</span>
            <span class="label">{{ group.label }}</span>
            <span class="arrow" :class="{ 'arrow-open': group.open }">›</span>
          </button>

          <!-- Items del grupo -->
          <div class="nav-group-items" :class="{ 'open': group.open || isGroupActive(group) }">
            <router-link
              v-for="item in group.items"
              :key="item.name"
              :to="item.path"
              class="nav-item sub-item"
              :class="{ active: currentPath === item.path }"
            >
              <span class="icon">{{ item.icon }}</span>
              <span class="label">{{ item.name }}</span>
            </router-link>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar-small">{{ userName.charAt(0).toUpperCase() }}</div>
          <span>{{ userName }}</span>
        </div>
        <button class="nav-item logout-btn" @click="logout">
          <span class="icon">🚪</span>
          <span class="label">Cerrar Sesión</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-header glass-panel">
        <div class="breadcrumbs">
          <span class="text-muted">Panel / </span>
          <span class="text-primary" style="font-weight: 600;">{{ currentPath.split('/').pop() || 'Inicio' }}</span>
        </div>
        <div class="user-profile">
          <div class="avatar">{{ userName.charAt(0).toUpperCase() }}</div>
        </div>
      </header>

      <div class="page-content animate-fade-in" style="padding: 1.5rem;">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: transparent;
}

.sidebar {
  width: 270px;
  min-width: 270px;
  height: calc(100vh - 2rem);
  margin: 1rem;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  position: relative;
  z-index: 10;
  overflow-y: auto;
}

.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 2px; }

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
}

.sidebar-header .logo { font-size: 2rem; }

.sidebar-header h2 {
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(to right, var(--text-main), var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.sidebar-role {
  font-size: 0.7rem;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

/* Grupos del NAV */
.nav-group { margin-bottom: 0.25rem; }

.nav-group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.nav-group-header .label { flex: 1; }

.nav-group-header .arrow {
  font-size: 1.25rem;
  transition: transform 0.3s ease;
  line-height: 1;
}

.nav-group-header .arrow-open { transform: rotate(90deg); }

.nav-group-header:hover, .nav-group-header.active-group {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-main);
}

.nav-group-items {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease;
}

.nav-group-items.open { max-height: 400px; }

/* Items del sub-menú */
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem 0.65rem 2rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: all 0.2s ease;
  text-decoration: none;
  background: transparent;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05));
  color: var(--primary);
  border-left: 2px solid var(--primary);
  font-weight: 600;
}

.icon { font-size: 1rem; min-width: 20px; text-align: center; }

/* Footer */
.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.avatar-small {
  width: 28px;
  height: 28px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  color: white;
}

.logout-btn { padding-left: 0.75rem; }

.logout-btn:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
}

/* Header */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 1rem 1rem 0;
  overflow: hidden;
}

.top-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  margin-bottom: 0;
}

.user-profile .avatar {
  background: var(--primary);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
  box-shadow: var(--shadow-glow);
}

.page-content {
  flex: 1;
  overflow-y: auto;
}

.page-content::-webkit-scrollbar { width: 6px; }
.page-content::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 3px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from { opacity: 0; transform: translateY(8px); }
.fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
