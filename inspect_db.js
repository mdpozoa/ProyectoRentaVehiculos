const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.giijpqoggmqdrmaldtwu:Pelucha2020@@aws-1-us-east-1.pooler.supabase.com:5432/postgres' });

async function run() {
  await client.connect();
  
  try {
    const updateRes = await client.query(`UPDATE vehiculos SET status = 'DISPONIBLE'`);
    console.log(`Updated ${updateRes.rowCount} vehicles to DISPONIBLE`);
  } catch(e) {
    console.log('Update failed:', e.message);
  }

  // Update images
  try {
    const res = await client.query('SELECT id, color, anio FROM vehiculos;');
    for(const row of res.rows) {
      let colorStr = row.color.trim();
      let imgName = `Spark${colorStr}${row.anio}.png`;
      let url = `/vehiculos/${imgName}`;
      await client.query(`UPDATE vehiculos SET imagen_url = $1 WHERE id = $2`, [url, row.id]);
      console.log(`Set ${url} for ${row.id}`);
    }
  } catch(e) {
    console.log('Update images failed:', e.message);
  }
  
  await client.end();
}
run().catch(console.error);
