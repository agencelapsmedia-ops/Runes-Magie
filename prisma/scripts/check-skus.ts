import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const total = await prisma.product.count();
  const withSku = await prisma.product.count({ where: { sku: { not: null } } });
  const fourDigit = await prisma.product.count({ where: { sku: { startsWith: '0' } } });
  const sample = await prisma.product.findMany({
    select: { sku: true, name: true },
    orderBy: { sku: 'asc' },
    take: 10,
  });
  const last = await prisma.product.findMany({
    select: { sku: true, name: true },
    orderBy: { sku: 'desc' },
    take: 5,
  });

  console.log(`Total : ${total}`);
  console.log(`Avec SKU : ${withSku}`);
  console.log(`Format 4-chiffres (starts with 0) : ${fourDigit}`);
  console.log('\nPremiers (ordre asc) :');
  for (const p of sample) console.log(`  ${p.sku} | ${p.name}`);
  console.log('\nDerniers (ordre desc) :');
  for (const p of last) console.log(`  ${p.sku} | ${p.name}`);

  await prisma.$disconnect();
})();
