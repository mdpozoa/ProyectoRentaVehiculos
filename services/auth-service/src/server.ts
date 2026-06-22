import 'dotenv/config';

// ── Prevent crash on transient DB errors (e.g. university firewall / Supabase waking up) ──
process.on('unhandledRejection', (reason: any) => {
  console.warn('⚠️  [auth] Unhandled rejection (non-fatal):', reason?.message ?? reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ [auth] Uncaught exception (non-fatal):', err.message);
  // Don't exit — the service will recover once DB becomes reachable
});

import app from './app.js';
import { startGrpcServer } from './shared/grpc/grpc-server.js';
import { usuarioRepo } from './shared/container.js';

const PORT      = process.env.PORT      ?? 3001;
const GRPC_PORT = process.env.GRPC_PORT ?? 4001;

app.listen(PORT, () => {
  console.log(`🔐 auth-service REST  → http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/auth/login`);
  console.log(`   → http://localhost:${PORT}/api/v1/mateodavid/auth/register`);

  // Start gRPC server
  startGrpcServer(usuarioRepo);
  console.log(`🔌 auth-service gRPC  → localhost:${GRPC_PORT}`);
});
