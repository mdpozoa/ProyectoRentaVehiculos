import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 3002;

app.listen(PORT, () => {
  console.log(`🚗 inventario-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/vehiculos`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/marcas`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/modelos`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/categorias`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/tipos-combustible`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/tipos-transmision`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/extras`);
});
