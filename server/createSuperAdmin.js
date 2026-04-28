const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@skenatrip.com';
  const password = 'password123';
  const name = 'Super Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('✅ Super Admin sudah ada dengan ID:', existing.id);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: 'superadmin',
    },
  });

  console.log('🟢 Super Admin berhasil dibuat:');
  console.log(`   Email:   ${user.email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch(e => {
    console.error('❌ Gagal membuat Super Admin:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
