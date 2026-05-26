const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mzgggdprufdvpzybpctv.supabase.co',
  'sb_publishable_4R9XAvZLQjxzwgKqUT8jtg_8EG30Pgj'
);

async function run() {
  try {
    const { data: vehiculos, error } = await supabase.from('Vehiculos').select('*');
    if (error) throw error;
    console.log("Vehiculos:", vehiculos);
    
    // Set them to Disponible
    for(const v of vehiculos) {
      await supabase.from('Vehiculos').update({ Estado_Vehiculo: 'Disponible' }).eq('ID_Vehiculo', v.ID_Vehiculo);
    }
    console.log("Updated to Disponible");

    // Update images
    for(const v of vehiculos) {
      let color = v.Color_Vehiculo.trim();
      let anio = v.Anio_Vehiculo;
      let img = `/vehiculos/Spark${color}${anio}.png`;
      await supabase.from('Vehiculos').update({ Imagen_Url: img }).eq('ID_Vehiculo', v.ID_Vehiculo);
      console.log(`Set ${img} for ${v.ID_Vehiculo}`);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
