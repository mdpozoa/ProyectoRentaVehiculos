<script setup>
</script>

<template>
  <div class="home-page">
    
    <!-- Hero Banner -->
    <section class="hero-section text-center">
      <!-- Usando la imagen descargada de Unsplash o base genérica para el hero -->
      <div class="hero-overlay"></div>
      <div class="container hero-content">
        <h1 class="hero-title">Domina el camino. Vive el lujo.</h1>
        <p class="hero-subtitle">
          En <strong>Zenith Drive</strong> unimos el rendimiento automotriz con la autenticidad urbana. Vehículos exclusivos, deportivos y gama alta para quienes viven la velocidad dentro y fuera de la ciudad.
        </p>
        <router-link to="/vehiculos" class="btn-primary" style="margin-top: 2rem;">
          Explorar Vehículos
        </router-link>
      </div>
    </section>

    <!-- Acerca De -->
    <section class="about-section bg-white">
      <div class="container about-grid">
        <div class="about-text">
          <h2 class="section-title text-dark">Acerca de Zenith Drive</h2>
          <p class="text-dark">
            Zenith Drive nació de la pasión por el automovilismo de lujo y la cultura de calle urbana. Nuestro objetivo es ofrecer a cada cliente, desde el ejecutivo hasta el aventurero de fin de semana, los mejores vehículos que potencien su estilo de vida sin perder seguridad. Creemos en la comunidad, la innovación y la excelencia como tres pilares que impulsan nuestro motor.
          </p>
          <p class="text-dark" style="margin-top: 1rem;">
            Más que una renta, somos un punto de encuentro para quienes sienten el rugir del motor y el pulso de la ciudad. Aquí encontrarás las últimas ediciones, híbridos técnicos, y colaboraciones con marcas icónicas del mundo automotriz.
          </p>
        </div>
        <div class="about-image-container">
          <img src="/imagens/LOGO CARRO.png" alt="Acerca de Zenith Drive" class="about-image" />
        </div>
      </div>
    </section>

    <!-- Nuestros Valores -->
    <section class="values-section bg-light">
      <div class="container">
        <h2 class="section-title text-center text-dark" style="margin-bottom: 3rem;">Nuestros Valores</h2>
        
        <div class="values-grid">
          <!-- Tarjeta 1 -->
          <div class="value-card">
            <h3 class="text-dark">Rendimiento</h3>
            <p class="text-primary font-weight-bold">
              Seleccionamos vehículos que impulsan tu viaje al máximo, con calidad automotriz y tecnología comprobada.
            </p>
          </div>
          
          <!-- Tarjeta 2 -->
          <div class="value-card">
            <h3 class="text-dark">Pasión por el Asfalto</h3>
            <p class="text-primary font-weight-bold">
              Vivimos y respiramos velocidad. Cada colección refleja la energía de la supercarretera y circuitos.
            </p>
          </div>
          
          <!-- Tarjeta 3 -->
          <div class="value-card">
            <h3 class="text-dark">Autenticidad Urbana</h3>
            <p class="text-primary font-weight-bold">
              Inspirados en la ciudad: crudo, real y con actitud de alta gama.
            </p>
          </div>

          <!-- Tarjeta 4 -->
          <div class="value-card">
            <h3 class="text-dark">Comunidad</h3>
            <p class="text-primary font-weight-bold">
              Apoyamos a nuestros conductores, eventos exclusivos y la cultura automovilística.
            </p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* Hero Section */
.hero-section {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Usando la nueva imagen de fondo */
  background-image: url('/imagens/CARRO FONDO.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.hero-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(18, 18, 18, 0.75); /* Dark overlay */
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 900px;
  padding: 0 2rem;
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
}

/* About Section */
.about-section {
  padding: 6rem 2rem;
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.section-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
}

.about-image-container {
  display: flex;
  justify-content: center;
}

.about-image {
  max-width: 100%;
  border-radius: 50%;
  box-shadow: var(--shadow-md);
  /* Similar a la forma circular de UbanHoops */
  object-fit: cover;
  width: 400px;
  height: 400px;
  border: 10px solid var(--bg-white);
}

/* Values Section */
.values-section {
  padding: 6rem 2rem;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.value-card {
  background-color: var(--bg-white);
  padding: 2.5rem 2rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  text-align: center;
  border-top: 4px solid var(--primary);
  transition: transform 0.3s ease;
}

.value-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
}

.value-card h3 {
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
}

.font-weight-bold {
  font-weight: 600;
  line-height: 1.6;
  font-size: 0.95rem;
}
</style>
