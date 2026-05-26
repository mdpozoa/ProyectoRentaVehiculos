const url = 'https://mzgggdprufdvpzybpctv.supabase.co/rest/v1/vehiculo';
const key = 'sb_publishable_4R9XAvZLQjxzwgKqUT8jtg_8EG30Pgj';

async function run() {
  // Get vehiculos
  const res = await fetch(`${url}?select=*`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await res.json();
  console.log("Vehiculos:", data.length);

  // Update them
  for(const v of data) {
    const patchRes = await fetch(`${url}?id_vehiculo=eq.${v.id_vehiculo}`, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        estado_vehiculo: 'Disponible'
      })
    });
    console.log(`Updated ${v.id_vehiculo}: ${patchRes.status}`);
  }
}
run();
