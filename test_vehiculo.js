const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://postgres.giijpqoggmqdrmaldtwu:Pelucha2020@@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true' }); 
client.connect().then(() => client.query("SELECT precio_dia FROM vehiculos WHERE id = 'ee4f428c-9654-4fcd-8b7d-93fdaec47657'")).then(res => { console.log(res.rows); client.end(); }).catch(console.error);
