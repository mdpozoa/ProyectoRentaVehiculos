import { createApp }    from 'vue'
import { createPinia }  from 'pinia'
import './style.css'
import App    from './App.vue'
import router from './router'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Rehidratar sesión al recargar la página
import('./stores/auth.store.js').then(({ useAuthStore }) => {
  useAuthStore().fetchMe()
})

app.mount('#app')

