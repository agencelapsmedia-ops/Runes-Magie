import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check a tarot
  const t = await prisma.product.findFirst({ where: { name: { contains: 'Interdit' } } });
  if (t) {
    console.log('=== TAROT ===');
    console.log('NOM:', t.name);
    console.log('DESC COURTE:', t.description);
    console.log('DESC LONGUE LENGTH:', t.longDescription.length);
    console.log('DESC LONGUE:', t.longDescription.substring(0, 200));
  }

  // Check an oracle
  const o = await prisma.product.findFirst({ where: { category: 'oracle' } });
  if (o) {
    console.log('\n=== ORACLE ===');
    console.log('NOM:', o.name);
    console.log('DESC COURTE:', o.description);
    console.log('DESC LONGUE LENGTH:', o.longDescription.length);
    console.log('DESC LONGUE:', o.longDescription.substring(0, 200));
  }

  // Count products with empty longDescription
  const emptyTarots = await prisma.product.count({ where: { category: 'tarot', longDescription: '' } });
  const emptyOracles = await prisma.product.count({ where: { category: 'oracle', longDescription: '' } });
  const totalTarots = await prisma.product.count({ where: { category: 'tarot' } });
  const totalOracles = await prisma.product.count({ where: { category: 'oracle' } });
  console.log(`\nTarots: ${emptyTarots}/${totalTarots} sans description longue`);
  console.log(`Oracles: ${emptyOracles}/${totalOracles} sans description longue`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
