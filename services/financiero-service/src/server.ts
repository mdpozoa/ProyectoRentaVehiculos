import 'dotenv/config';
import app from './app.js';
import { startGrpcServer } from './shared/grpc/grpc-server.js';
import { pagoRepository, facturaRepository } from './shared/container.js';

const PORT      = process.env.PORT      ?? 3005;
const GRPC_PORT = process.env.GRPC_PORT ?? 4003;

app.listen(PORT, () => {
  console.log(`💳 financiero-service REST  → http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/pagos`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/facturas`);

  // Start gRPC server
  startGrpcServer(pagoRepository, facturaRepository);
  console.log(`🔌 financiero-service gRPC  → localhost:${GRPC_PORT}`);
});
