import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 3004;

app.listen(PORT, () => {
  console.log(`📋 operaciones-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/reservas`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/alquileres`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/devoluciones`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/seguros`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/tarifas`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/canales-venta`);
});
