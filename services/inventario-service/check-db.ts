import { PrismaClient } from '@prisma/client';

console.log('Iniciando verificación de Base de Datos para inventario-service...');
console.log('Conectando a:', process.env.DATABASE_URL?.split('@')[1] || 'URL no configurada en las variables de entorno');

const prisma = new PrismaClient();

async function main() {
  try {
    const marcasCount = await prisma.marca.count();
    const modelosCount = await prisma.modelo.count();
    const categoriasCount = await prisma.categoria.count();
    const vehiculosCount = await prisma.vehiculo.count();
    const combustiblesCount = await prisma.tipoCombustible.count();
    const transmisionesCount = await prisma.tipoTransmision.count();
    const extrasCount = await prisma.extraEquipamiento.count();

    console.log('\n=============================================');
    console.log('       📊 RESUMEN DE DATOS EN LA BD         ');
    console.log('=============================================');
    console.log(` Marcas registradas:         ${marcasCount}`);
    console.log(` Modelos registrados:        ${modelosCount}`);
    console.log(` Categorías registradas:     ${categoriasCount}`);
    console.log(` Tipos de Combustible:       ${combustiblesCount}`);
    console.log(` Tipos de Transmisión:       ${transmisionesCount}`);
    console.log(` Extras de Equipamiento:     ${extrasCount}`);
    console.log(` Vehículos registrados:      ${vehiculosCount}`);
    console.log('=============================================\n');

    if (marcasCount > 0) {
      console.log('--- 🏷️  MARCAS REGISTRADAS (Primeras 5) ---');
      const marcas = await prisma.marca.findMany({ take: 5 });
      console.table(marcas.map(m => ({ ID: m.id, Nombre: m.nombre })));
    }

    if (categoriasCount > 0) {
      console.log('\n--- 📁 CATEGORÍAS REGISTRADAS (Primeras 5) ---');
      const categorias = await prisma.categoria.findMany({ take: 5 });
      console.table(categorias.map(c => ({ ID: c.id, Nombre: c.nombre, Descripción: c.descripcion })));
    }

    if (vehiculosCount > 0) {
      console.log('\n--- 🚗 VEHÍCULOS REGISTRADOS (Primeros 5) ---');
      const vehiculos = await prisma.vehiculo.findMany({
        take: 5,
        include: {
          modelo: {
            include: {
              marca: true
            }
          },
          categoria: true
        }
      });
      const mapped = vehiculos.map(v => ({
        Placa: v.placa,
        Color: v.color,
        Año: v.anio,
        PrecioPorDía: `$${v.precioDia}`,
        Estado: v.status,
        Marca: v.modelo?.marca?.nombre || 'N/A',
        Modelo: v.modelo?.nombre || 'N/A',
        Categoría: v.categoria?.nombre || 'N/A'
      }));
      console.table(mapped);
    } else {
      console.log('\nℹ️ No se encontraron vehículos registrados en la tabla "vehiculos".');
    }

  } catch (error) {
    console.error('\n❌ Error al conectar o consultar la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
