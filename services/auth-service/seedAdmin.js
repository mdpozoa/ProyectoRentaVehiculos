const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@zenithdrive.com';
  const password = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.usuario.upsert({
    where: { email },
    update: {
      passwordHash: password,
      role: 'ADMIN'
    },
    create: {
      email,
      passwordHash: password,
      nombres: 'Administrador',
      apellidos: 'Zenith',
      role: 'ADMIN'
    }
  });
  
  console.log('Admin user created/updated:', user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
