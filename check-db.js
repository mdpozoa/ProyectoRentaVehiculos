const { Client } = require('pg');

const clientPagos = new Client({ connectionString: 'postgresql://postgres.zvmluremkzsyqjyhhyyo:Pelucha2020@@aws-1-us-west-2.pooler.supabase.com:5432/postgres' });
const clientInventario = new Client({ connectionString: 'postgresql://postgres.giijpqoggmqdrmaldtwu:Pelucha2020@@aws-1-us-east-1.pooler.supabase.com:5432/postgres' });

async function run() {
  await clientPagos.connect();
  const resPagos = await clientPagos.query('SELECT * FROM pagos ORDER BY created_at DESC LIMIT 3;');
  console.log("=== PAGOS ===");
  console.table(resPagos.rows);
  await clientPagos.end();

  await clientInventario.connect();
  const resInv = await clientInventario.query("SELECT id, status, disponible FROM vehiculos WHERE id = '15a8a61f-d862-4113-a058-184f92acaca7';");
  console.log("=== VEHICULO CANCELADO ===");
  console.table(resInv.rows);
  await clientInventario.end();
}

run().catch(console.error);
