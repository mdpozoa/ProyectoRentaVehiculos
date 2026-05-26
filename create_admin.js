const { Client } = require('pg');
const bcrypt = require('bcryptjs'); // Using bcryptjs to avoid native build issues
const crypto = require('crypto');

const client = new Client({ connectionString: 'postgresql://postgres.hamgbdcuedmdqrkqaczc:Pelucha2020@@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function createAdmin() {
  try {
    await client.connect();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin12345', 10);
    const id = crypto.randomUUID();

    await client.query(`
      INSERT INTO usuarios (id, email, password_hash, nombres, apellidos, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, [id, 'mateouser@gmail.com', hashedPassword, 'Mateo', 'Admin', 'ADMIN', true]);
    
    console.log("Admin user created successfully!");
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

createAdmin();
