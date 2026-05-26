const url = 'https://mzgggdprufdvpzybpctv.supabase.co/rest/v1/vehiculo';
const key = 'sb_publishable_4R9XAvZLQjxzwgKqUT8jtg_8EG30Pgj';

async function run() {
  const res = await fetch(`${url}?select=*`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await res.json();
  console.log("Current DB Status:");
  for (const v of data) {
    console.log(`- ${v.placa_vehiculo}: ${v.estado_vehiculo}`);
  }
}
run();
