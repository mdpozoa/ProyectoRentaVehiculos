import 'dotenv/config';

// ── Prevent crash on transient DB errors (e.g. Supabase waking up) ──────────
process.on('unhandledRejection', (reason: any) => {
  console.warn('⚠️  [inventario] Unhandled rejection (non-fatal):', reason?.message ?? reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ [inventario] Uncaught exception:', err.message);
  // Don't exit — let the service keep running so it recovers once DB is available
});
import app from './app.js';
import { startGrpcServer } from './shared/grpc/grpc-server.js';
import { vehiculoRepository } from './shared/container.js';

const PORT      = process.env.PORT      ?? 3002;
const GRPC_PORT = process.env.GRPC_PORT ?? 4004;

app.listen(PORT, () => {
  console.log(`🚗 inventario-service REST  → http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/vehiculos`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/marcas`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/modelos`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/categorias`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/tipos-combustible`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/tipos-transmision`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/extras`);

  // Arrancar servidor gRPC (VehiculoService)
  startGrpcServer(vehiculoRepository);
  console.log(`🔌 inventario-service gRPC  → localhost:${GRPC_PORT}`);
});
