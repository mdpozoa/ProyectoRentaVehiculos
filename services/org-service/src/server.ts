import 'dotenv/config';
import app from './app.js';
import { startGrpcServer } from './shared/grpc/grpc-server.js';
import { organizacionRepo } from './shared/container.js';

const PORT      = process.env.PORT      ?? 3003;
const GRPC_PORT = process.env.GRPC_PORT ?? 4007;

app.listen(PORT, () => {
  console.log(`🏢 org-service REST  → http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/provincias`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/ciudades`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/empresas`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/agencias`);

  // Start gRPC server
  startGrpcServer(organizacionRepo);
  console.log(`🔌 org-service gRPC  → localhost:${GRPC_PORT}`);
});
