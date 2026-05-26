const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: 'postgresql://postgres.hamgbdcuedmdqrkqaczc:Pelucha2020@@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query('SELECT * FROM "Marcas"');
  console.log('Marcas:', res.rows);
  const mod = await client.query('SELECT * FROM "Modelos"');
  console.log('Modelos:', mod.rows);
  await client.end();
}
check().catch(console.error);
