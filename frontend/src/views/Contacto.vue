<script setup>
import { ref } from 'vue';

const form = ref({ name: '', email: '', message: '' });
const submitted = ref(false);

const submitForm = () => {
  // Simulate sending
  setTimeout(() => {
    submitted.value = true;
    form.value = { name: '', email: '', message: '' };
  }, 800);
};
</script>

<template>
  <div class="contact-page">
    <div class="container contact-container">
      <div class="contact-info">
        <h1 class="page-title text-primary">Mesa de Ayuda</h1>
        <p class="subtitle text-muted">
          ¿Tienes alguna duda sobre nuestras rentas, vehículos disponibles o contratos corporativos? 
          Déjanos un mensaje y nuestro equipo de élite te responderá al instante.
        </p>

        <div class="info-blocks">
          <div class="info-item">
            <span class="icon">📍</span>
            <div>
              <strong>Ubicación</strong>
              <p>Av. República de El Salvador y Moscú, Quito</p>
            </div>
          </div>
          <div class="info-item">
            <span class="icon">📞</span>
            <div>
              <strong>Teléfono</strong>
              <p>+593 99 999 9999</p>
            </div>
          </div>
          <div class="info-item">
            <span class="icon">✉️</span>
            <div>
              <strong>Email</strong>
              <p>soporte@luminarent.com</p>
            </div>
          </div>
        </div>
      </div>

      <div class="contact-form-wrapper glass-panel">
        <h2 style="margin-bottom: 1.5rem;">Escríbenos</h2>
        
        <div v-if="submitted" class="success-message">
          <span style="font-size: 3rem; display:block; margin-bottom: 1rem;">✅</span>
          <h3>Mensaje Enviado</h3>
          <p class="text-muted">Nos pondremos en contacto contigo muy pronto.</p>
          <button class="btn-outline" style="margin-top: 1.5rem;" @click="submitted = false">Enviar otro</button>
        </div>

        <form v-else @submit.prevent="submitForm" class="contact-form">
          <div class="form-group">
            <label>Nombre Completo</label>
            <input type="text" v-model="form.name" class="input-field" required placeholder="Ej. Juan Pérez" />
          </div>
          
          <div class="form-group">
            <label>Correo Electrónico</label>
            <input type="email" v-model="form.email" class="input-field" required placeholder="tu@correo.com" />
          </div>
          
          <div class="form-group">
            <label>Mensaje / Consulta</label>
            <textarea v-model="form.message" class="input-field" rows="5" required placeholder="Escribe tu duda aquí..."></textarea>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">Enviar Mensaje</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-page {
  padding: 4rem 2rem;
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
}

.contact-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.page-title {
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 3rem;
  max-width: 90%;
}

.info-blocks {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-item .icon {
  font-size: 2rem;
  background: var(--secondary);
  padding: 1rem;
  border-radius: var(--radius-md);
  color: var(--primary);
}

.contact-form-wrapper {
  padding: 3rem;
  border-top: 4px solid var(--primary);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-muted);
}

.success-message {
  text-align: center;
  padding: 3rem 1rem;
}

@media (max-width: 900px) {
  .contact-container {
    grid-template-columns: 1fr;
  }
}
</style>
