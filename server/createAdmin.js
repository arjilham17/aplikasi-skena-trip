const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@skenatrip.com';
  
  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  
  if (existingAdmin) {
    console.log('Admin account already exists:', existingAdmin.email);
    return;
  }

  // Create new admin
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: email,
      password: hashedPassword,
      role: 'admin'
    }
  });
  
  console.log('Admin account created successfully:');
  console.log('Email:', admin.email);
  console.log('Password: Admin123!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
