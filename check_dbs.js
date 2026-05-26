const { Client } = require('pg');

async function checkDb(url, name) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`\n--- Tables in ${name} ---`);
    console.log(res.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error(`Error connecting to ${name}:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  const authUrl = "postgresql://postgres.hamgbdcuedmdqrkqaczc:Pelucha2020@@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const invUrl = "postgresql://postgres.giijpqoggmqdrmaldtwu:Pelucha2020@@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  
  await checkDb(authUrl, "Monolith/Auth DB");
  await checkDb(invUrl, "Inventario DB");
}

main();
