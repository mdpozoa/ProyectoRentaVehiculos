require('dotenv').config({ path: './services/operaciones-service/.env' });
const { PrismaClient } = require('./services/operaciones-service/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const vehiculoId = '821346ea-0a2f-47f4-9702-55ac97b0253e';
    const conflicto = await prisma.reserva.findFirst({
      where: { vehiculoId, status: { notIn: ['CANCELADA', 'COMPLETADA'] } },
    });
    console.log('Conflicto:', conflicto);

    const reserva = await prisma.reserva.create({
      data: {
        usuarioId: '11111111-1111-1111-1111-111111111111',
        vehiculoId,
        agenciaId: '11111111-1111-1111-1111-111111111111',
        fechaInicio: new Date('2026-06-01T00:00:00.000Z'),
        fechaFin: new Date('2026-06-05T00:00:00.000Z'),
        diasTotal: 4,
        precioBase: 100,
        precioExtras: 0,
        precioSeguro: 0,
        totalAmount: 100,
        codigoReserva: 'TEST-123',
      }
    });
    console.log('Reserva creada:', reserva);
  } catch (err) {
    console.error('Error Prisma:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
