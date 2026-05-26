const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: 'postgresql://postgres.hamgbdcuedmdqrkqaczc:Pelucha2020@@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log('Tables:', res.rows.map(r => r.table_name));
  await client.end();
}
check().catch(console.error);
