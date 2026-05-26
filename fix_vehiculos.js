const { Client } = require('pg');

async function fixVehicles() {
  const client = new Client({ connectionString: 'postgresql://postgres.giijpqoggmqdrmaldtwu:Pelucha2020@@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();

  const corollaId = '33333333-3333-3333-3333-333333333333';
  const tucsonId = '44444444-4444-4444-4444-444444444444';
  
  // Insert a new Marca and Modelo just to have variety
  const kiaMarcaId = 'a1111111-1111-1111-1111-111111111111';
  await client.query(`INSERT INTO marcas (id, nombre) VALUES ($1, 'Kia') ON CONFLICT DO NOTHING`, [kiaMarcaId]);
  
  const sportageId = 'b2222222-2222-2222-2222-222222222222';
  await client.query(`INSERT INTO modelos (id, marca_id, nombre) VALUES ($1, $2, 'Sportage') ON CONFLICT DO NOTHING`, [sportageId, kiaMarcaId]);

  // Images
  const imgCorolla = 'https://images.unsplash.com/photo-1629897048514-3dd74142ffdc?auto=format&fit=crop&w=600&q=80'; // generic sedan
  const imgTucson = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'; // generic suv
  const imgSportage = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'; // generic crossover

  // Update PDF-2456 -> Tucson
  await client.query(`UPDATE vehiculos SET modelo_id = $1, imagen_url = $2 WHERE placa = 'PDF-2456'`, [tucsonId, imgTucson]);
  
  // Update PBZ-1205 -> Corolla
  await client.query(`UPDATE vehiculos SET modelo_id = $1, imagen_url = $2 WHERE placa = 'PBZ-1205'`, [corollaId, imgCorolla]);

  // Update PKT-2031 -> Sportage
  await client.query(`UPDATE vehiculos SET modelo_id = $1, imagen_url = $2 WHERE placa = 'PKT-2031'`, [sportageId, imgSportage]);

  // Images for new ones
  const imgNissan = 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&w=600&q=80';
  const imgChevrolet = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80';
  const imgFord = 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=600&q=80';

  // Add new Marcas and Modelos for variety
  const nissanId = 'a3333333-3333-3333-3333-333333333333';
  const versaId = 'b4444444-4444-4444-4444-444444444444';
  await client.query(`INSERT INTO marcas (id, nombre) VALUES ($1, 'Nissan') ON CONFLICT DO NOTHING`, [nissanId]);
  await client.query(`INSERT INTO modelos (id, marca_id, nombre) VALUES ($1, $2, 'Versa') ON CONFLICT DO NOTHING`, [versaId, nissanId]);

  const chevroletId = 'c5555555-5555-5555-5555-555555555555';
  const sparkId = 'd6666666-6666-6666-6666-666666666666';
  await client.query(`INSERT INTO marcas (id, nombre) VALUES ($1, 'Chevrolet') ON CONFLICT DO NOTHING`, [chevroletId]);
  await client.query(`INSERT INTO modelos (id, marca_id, nombre) VALUES ($1, $2, 'Spark') ON CONFLICT DO NOTHING`, [sparkId, chevroletId]);

  const fordId = 'e7777777-7777-7777-7777-777777777777';
  const escapeId = 'f8888888-8888-8888-8888-888888888888';
  await client.query(`INSERT INTO marcas (id, nombre) VALUES ($1, 'Ford') ON CONFLICT DO NOTHING`, [fordId]);
  await client.query(`INSERT INTO modelos (id, marca_id, nombre) VALUES ($1, $2, 'Escape') ON CONFLICT DO NOTHING`, [escapeId, fordId]);

  // Update new vehicles
  await client.query(`UPDATE vehiculos SET modelo_id = $1, imagen_url = $2 WHERE placa = 'GTA-6969'`, [versaId, imgNissan]);
  await client.query(`UPDATE vehiculos SET modelo_id = $1, imagen_url = $2 WHERE placa = 'PED-2016'`, [sparkId, imgChevrolet]);
  await client.query(`UPDATE vehiculos SET modelo_id = $1, imagen_url = $2 WHERE placa = 'PDW-2123'`, [escapeId, imgFord]);

  console.log('Vehicles updated successfully with models and images!');
  await client.end();
}
fixVehicles().catch(console.error);
