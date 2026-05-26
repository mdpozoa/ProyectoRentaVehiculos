const { Client } = require('pg');

const crypto = require('crypto');

async function sync() {
  const client = new Client({ connectionString: 'postgresql://postgres.giijpqoggmqdrmaldtwu:Pelucha2020@@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  
  // Get foreign keys
  const mod = await client.query('SELECT id FROM modelos LIMIT 1');
  const cat = await client.query('SELECT id FROM categorias LIMIT 1');
  const tc = await client.query('SELECT id FROM tipos_combustible LIMIT 1');
  const tt = await client.query('SELECT id FROM tipos_transmision LIMIT 1');
  const modeloId = mod.rows[0].id;
  const categoriaId = cat.rows[0].id;
  const tcId = tc.rows[0].id;
  const ttId = tt.rows[0].id;

  // Clear existing vehiculos
  await client.query('DELETE FROM vehiculos');

  const response = await fetch('https://scintillating-warmth-production-d1f6.up.railway.app/api/Vehiculos');
  const data = await response.json();
  const vehiculos = Array.isArray(data) ? data : (data.value || []);
  console.log(`Found ${vehiculos.length} vehicles from monolith`);

  for(let v of vehiculos) {
    const id = crypto.randomUUID();
    const status = v.Estado_Vehiculo.toUpperCase() === 'DISPONIBLE' ? 'DISPONIBLE' : 'EN_USO';
    await client.query(`
      INSERT INTO vehiculos (id, modelo_id, categoria_id, tipo_combustible_id, tipo_transmision_id, placa, color, anio, kilometraje, precio_dia, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      id, modeloId, categoriaId, tcId, ttId,
      v.Placa_Vehiculo, v.Color_Vehiculo, v.Anio_Vehiculo,
      v.Kilometraje_Vehiculo || 0,
      45.00, // default precio
      status
    ]);
  }
  console.log('SYNC SUCCESSFUL!');
  await client.end();
}
sync().catch(console.error);
