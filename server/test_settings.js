const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: { heroImages: true }
    });
    console.log('Settings found:', JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('Error fetching settings:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
