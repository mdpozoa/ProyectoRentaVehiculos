const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.giijpqoggmqdrmaldtwu:Pelucha2020@@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function resetVehicles() {
  try {
    await client.connect();
    const result = await client.query("UPDATE vehiculos SET status = 'DISPONIBLE' WHERE status != 'DISPONIBLE'");
    console.log(`Updated ${result.rowCount} vehicles to DISPONIBLE`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

resetVehicles();
