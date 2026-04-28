const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.promoCode.create({ data: { code: 'TEST_123', discountAmount: 10, discountType: 'percentage' }});
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => prisma.$disconnect());
