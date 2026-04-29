const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: 'Skena Trip',
      slogan: 'Teman Perjalanan Skena Kamu',
      heroTitle: 'Temukan Petualangan Skena Kamu',
      heroSubtitle: 'Jelajahi destinasi tersembunyi dengan gaya hidup skena yang autentik.',
      contactEmail: 'info@skenatrip.com',
      contactPhone: '08123456789',
      address: 'Jakarta, Indonesia',
      expenseThreshold: 1000000
    }
  });

  console.log('Site Settings initialized:', settings.siteName);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
