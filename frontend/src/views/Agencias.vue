<script setup>
</script>

<template>
  <div class="agencies-page container" style="padding-top: 4rem; padding-bottom: 4rem;">
    <!-- Breadcrumb -->
    <div class="breadcrumb text-muted" style="margin-bottom: 2rem; font-size: 0.85rem;">
      <router-link to="/" class="text-muted" style="text-decoration: underline;">Inicio</router-link> / Red De Agencias
    </div>

    <!-- Title Area -->
    <div class="page-header" style="margin-bottom: 3rem;">
      <h1 class="page-title text-primary" style="font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem;">Red de agencias</h1>
      <p style="font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase;">Encuentra la agencia más cercana</p>
      
      <!-- Search Input resembling the picture -->
      <div class="search-container">
        <span class="search-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input 
          type="text" 
          placeholder="Ingresa el país, departamento o ciudad de la agencia." 
          class="search-input"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.agencies-page {
  min-height: calc(100vh - 100px);
}

.search-container {
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--glass-border);
  padding: 0.5rem 0;
  transition: border-color 0.3s ease;
  max-width: 800px;
}

.search-container:focus-within {
  border-bottom-color: var(--primary);
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: var(--text-muted);
}

.search-input {
  background: transparent;
  border: none;
  color: var(--text-main);
  font-size: 1.25rem;
  width: 100%;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 1.25rem;
}
</style>
