import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tarot = await prisma.product.updateMany({
    where: { category: 'tarot' },
    data: { price: 39.99 },
  });
  console.log(`${tarot.count} tarots mis a 39.99$`);

  const oracle = await prisma.product.updateMany({
    where: { category: 'oracle' },
    data: { price: 39.99 },
  });
  console.log(`${oracle.count} oracles mis a 39.99$`);

  console.log(`Total: ${tarot.count + oracle.count} produits mis a jour.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
