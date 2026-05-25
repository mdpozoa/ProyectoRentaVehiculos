import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 3006;

app.listen(PORT, () => {
  console.log(`🔧 mantenimiento-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/mantenimientos`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/kardex`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/sistemas-externos`);
});
