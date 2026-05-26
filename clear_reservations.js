const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres.aidmynoeryywzsbjedbv:Pelucha2020@@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function clearReservations() {
  try {
    await client.connect();
    const result = await client.query("DELETE FROM reservas WHERE status = 'PENDIENTE'");
    console.log(`Deleted ${result.rowCount} PENDIENTE reservations.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

clearReservations();
