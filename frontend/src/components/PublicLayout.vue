<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route  = useRoute();

const role  = ref(null);
const token = ref(null);
const menuOpen = ref(false);

onMounted(() => {
  role.value  = localStorage.getItem('user_role');
  token.value = localStorage.getItem('auth_token');
});

const navigation = [
  { name: 'Inicio',          path: '/' },
  { name: 'Catálogo',        path: '/vehiculos' },
  { name: 'Red de Agencias', path: '/agencias' },
  { name: 'Contacto',        path: '/contacto' },
];

const handleAuthAction = () => {
  menuOpen.value = false;
  if (!token.value) {
    router.push('/login');
  } else if (role.value === 'admin') {
    router.push('/admin/vehiculos');
  } else {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('reserva_activa');
    localStorage.removeItem('vehiculo_pendiente');
    token.value = null;
    role.value  = null;
    router.push('/');
  }
};

const closeMenu = () => { menuOpen.value = false; };
</script>

<template>
  <div class="public-layout">
    <header class="public-header">
      <div class="container header-content">

        <!-- Logo -->
        <div class="logo">
          <router-link to="/" @click="closeMenu">
            <div class="logo-box" style="background:transparent;border:none;">
              <img src="/imagens/CARRO LETRAS.png" alt="Logo" style="height:58px;object-fit:contain;">
            </div>
          </router-link>
        </div>

        <!-- Desktop nav -->
        <nav class="public-nav desktop-nav">
          <router-link
            v-for="item in navigation" :key="item.name"
            :to="item.path" class="nav-link" active-class="active"
          >{{ item.name }}</router-link>

          <router-link
            v-if="token && role !== 'admin'"
            to="/mis-reservas" class="nav-link" active-class="active"
          >Mis Reservas</router-link>

          <button @click="handleAuthAction" class="btn-login-nav">
            {{ !token ? 'Iniciar Sesión' : (role === 'admin' ? 'Panel Admin' : 'Cerrar Sesión') }}
          </button>
        </nav>

        <!-- Hamburger (mobile) -->
        <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="Menú">
          <span :class="{ open: menuOpen }"></span>
          <span :class="{ open: menuOpen }"></span>
          <span :class="{ open: menuOpen }"></span>
        </button>
      </div>

      <!-- Mobile drawer -->
      <transition name="slide-down">
        <nav v-if="menuOpen" class="mobile-nav">
          <router-link
            v-for="item in navigation" :key="item.name"
            :to="item.path" class="mobile-link" active-class="active"
            @click="closeMenu"
          >{{ item.name }}</router-link>

          <router-link
            v-if="token && role !== 'admin'"
            to="/mis-reservas" class="mobile-link" active-class="active"
            @click="closeMenu"
          >Mis Reservas</router-link>

          <button @click="handleAuthAction" class="btn-login-nav mobile-auth-btn">
            {{ !token ? 'Iniciar Sesión' : (role === 'admin' ? 'Panel Admin' : 'Cerrar Sesión') }}
          </button>
        </nav>
      </transition>
    </header>

    <main class="main-body">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="public-footer">
      <div class="container text-center">
        <p class="footer-cta">Sé parte del movimiento. Recibe noticias, nuevos vehículos y ofertas exclusivas.</p>
        <div class="footer-links">
          <router-link to="/">Inicio</router-link> |
          <router-link to="/vehiculos">Vehículos</router-link> |
          <router-link to="/contacto">Contacto</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.public-layout { display: flex; flex-direction: column; min-height: 100vh; }

/* ── Header ── */
.public-header {
  background: rgba(11, 15, 26, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  z-index: 200;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
}

.logo a { text-decoration: none; }

/* ── Desktop Nav ── */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

.nav-link {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.95rem;
  transition: color 0.2s;
}
.nav-link:hover, .nav-link.active { color: var(--text-main); }
.nav-link.active {
  border-bottom: 2px solid var(--accent);
  padding-bottom: 3px;
}

.btn-login-nav {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 0.45rem 1.3rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.btn-login-nav:hover {
  background: var(--primary);
  color: white;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
}

/* ── Hamburger ── */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
}
.hamburger span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--text-main);
  border-radius: 2px;
  transition: all 0.3s ease;
}
.hamburger span.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger span.open:nth-child(2) { opacity: 0; }
.hamburger span.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── Mobile drawer ── */
.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: rgba(11, 15, 26, 0.98);
  border-top: 1px solid var(--glass-border);
  padding: 1rem 1.5rem 1.5rem;
}
.mobile-link {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 1.05rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: color 0.2s;
}
.mobile-link:hover, .mobile-link.active { color: var(--primary); }
.mobile-auth-btn {
  margin-top: 1rem;
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}

/* ── Transitions ── */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Main body ── */
.main-body { flex: 1; }

/* ── Footer ── */
.public-footer {
  background: linear-gradient(to top, var(--bg-darker), rgba(30, 39, 64, 0.6));
  padding: 3rem 2rem;
  border-top: 1px solid var(--glass-border);
}
.footer-cta { font-size: 1rem; color: var(--text-muted); margin-bottom: 1.25rem; }
.footer-links { font-weight: 600; font-size: 0.9rem; }
.footer-links a { color: var(--primary); margin: 0 0.5rem; }
.footer-links a:hover { color: var(--accent); text-decoration: underline; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .hamburger   { display: flex; }
  .header-content { padding: 0.75rem 1.25rem; }
}
</style>