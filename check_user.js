const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hamgbdcuedmdqrkqaczc:Pelucha2020@@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function checkUser() {
  try {
    await client.connect();
    const result = await client.query("SELECT id, email, role FROM usuarios WHERE email = 'mateouser@gmail.com'");
    if (result.rows.length > 0) {
      console.log("User found:", result.rows[0]);
    } else {
      console.log("User not found.");
      const allUsers = await client.query("SELECT email, role FROM usuarios LIMIT 5");
      console.log("Some users in DB:", allUsers.rows);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkUser();
